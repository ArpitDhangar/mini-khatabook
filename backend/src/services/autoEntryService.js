const cron = require('node-cron');
const Customer = require('../models/Customer');
const LedgerEntry = require('../models/LedgerEntry');

// ─── Date Utilities ──────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD string (local timezone safe) */
const getTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Adds N days to a YYYY-MM-DD string, returns new YYYY-MM-DD string */
const addDays = (dateStr, days) => {
  const date = new Date(dateStr + 'T00:00:00'); // force midnight local
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Returns all dates (YYYY-MM-DD) from startDate to endDate inclusive */
const getDateRange = (startDate, endDate) => {
  const dates = [];
  let current = startDate;
  while (current <= endDate) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
};

// ─── Business Logic Helpers ──────────────────────────────────────────────────

/**
 * Checks if a given date falls within any of the customer's pause periods.
 * Returns true if the customer was paused on that date.
 */
const isDatePaused = (customer, dateStr) => {
  for (const period of customer.pausePeriods) {
    const from = period.from;
    const to = period.to || getTodayString(); // null to = still paused
    if (dateStr >= from && dateStr <= to) return true;
  }
  return false;
};

/**
 * Gets the correct daily amount for a given date.
 * Walks amountHistory (sorted ascending by 'from') to find the last applicable rate.
 * Falls back to customer.dailyAmount if no history exists.
 */
const getAmountForDate = (customer, dateStr) => {
  if (!customer.amountHistory || customer.amountHistory.length === 0) {
    return customer.dailyAmount;
  }
  // Sort by date ascending
  const sorted = [...customer.amountHistory].sort((a, b) =>
    a.from.localeCompare(b.from)
  );
  let amount = customer.dailyAmount;
  for (const entry of sorted) {
    if (entry.from <= dateStr) {
      amount = entry.amount;
    }
  }
  return amount;
};

// ─── Core Entry Generation ────────────────────────────────────────────────────

/**
 * Generates missing daily debit entries for a single customer.
 * - Starts from the day after lastEntryDate (or startDate if no entries yet)
 * - Skips paused dates
 * - Prevents duplicates by checking existing entries
 * - Uses bulkWrite for performance
 *
 * @returns {number} Count of new entries created
 */
const generateEntriesForCustomer = async (customer) => {
  const today = getTodayString();

  // Determine the first date we need to check
  let fromDate;
  if (customer.lastEntryDate) {
    fromDate = addDays(customer.lastEntryDate, 1);
  } else {
    fromDate = customer.startDate;
  }

  // Nothing to generate
  if (fromDate > today) return 0;

  const dates = getDateRange(fromDate, today);

  // Fetch existing entries for this date range to prevent duplicates
  const existingEntries = await LedgerEntry.find({
    customerId: customer._id,
    date: { $in: dates },
    isDeleted: false,
    isAuto: true,
  }).select('date');

  const existingDates = new Set(existingEntries.map((e) => e.date));

  // Build new entries
  const newEntries = [];
  let latestDate = customer.lastEntryDate;

  for (const date of dates) {
    // Skip if entry already exists
    if (existingDates.has(date)) {
      latestDate = date;
      continue;
    }
    // Skip if customer was paused on this date
    if (isDatePaused(customer, date)) {
      latestDate = date; // still advance lastEntryDate past pause
      continue;
    }

    const amount = getAmountForDate(customer, date);
    newEntries.push({
      customerId: customer._id,
      date,
      amount,
      type: 'debit',
      isAuto: true,
      isDeleted: false,
    });

    latestDate = date;
  }

  // Bulk insert new entries
  if (newEntries.length > 0) {
    await LedgerEntry.insertMany(newEntries, { ordered: false });
  }

  // Update customer's lastEntryDate
  if (latestDate && latestDate !== customer.lastEntryDate) {
    await Customer.findByIdAndUpdate(customer._id, { lastEntryDate: latestDate });
  }

  return newEntries.length;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates missing entries for ALL active customers with autoEntry enabled.
 * Called by the cron job and the fallback endpoint when app loads.
 *
 * @returns {{ total: number, customers: number }} Summary of entries created
 */
const generateAllMissingEntries = async () => {
  const customers = await Customer.find({
    isActive: true,
    autoEntryEnabled: true,
    isPaused: false, // entirely skip paused customers (per-date pause handled inside)
  });

  let totalCreated = 0;
  let customersProcessed = 0;

  for (const customer of customers) {
    try {
      const count = await generateEntriesForCustomer(customer);
      totalCreated += count;
      customersProcessed++;
    } catch (err) {
      console.error(`Failed to generate entries for customer ${customer._id}:`, err.message);
    }
  }

  console.log(`✅ Auto-entry: Created ${totalCreated} entries for ${customersProcessed} customers`);
  return { total: totalCreated, customers: customersProcessed };
};

/**
 * Generates missing entries for a specific customer only.
 * Used when viewing a customer's ledger to ensure it's up to date.
 */
const generateMissingEntriesForCustomer = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer || !customer.isActive || !customer.autoEntryEnabled) return 0;
  return generateEntriesForCustomer(customer);
};

/**
 * Starts the daily cron job — runs at midnight every day.
 * Uses node-cron with server's local time.
 */
const startCronJob = () => {
  // "0 0 * * *" = midnight every day
  cron.schedule('0 0 * * *', async () => {
    console.log('🕐 Cron: Running daily auto-entry generation...');
    try {
      const result = await generateAllMissingEntries();
      console.log(`🕐 Cron: Done. Created ${result.total} entries.`);
    } catch (err) {
      console.error('🕐 Cron: Error during auto-entry generation:', err.message);
    }
  });
  console.log('⏰ Daily cron job scheduled (midnight)');
};

module.exports = {
  generateAllMissingEntries,
  generateMissingEntriesForCustomer,
  startCronJob,
};
