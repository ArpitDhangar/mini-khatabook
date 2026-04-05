const Customer = require('../models/Customer');
const LedgerEntry = require('../models/LedgerEntry');

// Helper: today as YYYY-MM-DD
const getTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ─── GET /api/customers ───────────────────────────────────────────────────────
const getAllCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({ isActive: true }).sort({ createdAt: -1 });

    // Attach balance summary to each customer for dashboard display
    const customersWithBalance = await Promise.all(
      customers.map(async (customer) => {
        const entries = await LedgerEntry.find({
          customerId: customer._id,
          isDeleted: false,
        });
        const totalDebit  = entries.filter((e) => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
        const totalCredit = entries.filter((e) => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
        return {
          ...customer.toObject(),
          totalDebit,
          totalCredit,
          balance: totalDebit - totalCredit, // positive = customer owes
        };
      })
    );

    res.json({ success: true, data: customersWithBalance });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/customers/:id ───────────────────────────────────────────────────
const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/customers ──────────────────────────────────────────────────────
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, dailyAmount, startDate, autoEntryEnabled } = req.body;

    const customer = await Customer.create({
      name,
      phone,
      dailyAmount,
      startDate,
      autoEntryEnabled: autoEntryEnabled !== undefined ? autoEntryEnabled : true,
      // Initialize amount history with the starting amount
      amountHistory: [{ amount: dailyAmount, from: startDate }],
    });

    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/customers/:id ───────────────────────────────────────────────────
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const { name, phone, dailyAmount, newAmountFrom, autoEntryEnabled, startDate } = req.body;

    // If daily amount is being changed, record it in history
    if (dailyAmount !== undefined && dailyAmount !== customer.dailyAmount) {
      const effectiveFrom = newAmountFrom || getTodayString();
      customer.amountHistory.push({ amount: dailyAmount, from: effectiveFrom });
      customer.dailyAmount = dailyAmount;
    }

    if (name !== undefined)              customer.name = name;
    if (phone !== undefined)             customer.phone = phone;
    if (autoEntryEnabled !== undefined)  customer.autoEntryEnabled = autoEntryEnabled;
    if (startDate !== undefined)         customer.startDate = startDate;

    await customer.save();
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/customers/:id (soft delete) ─────────────────────────────────
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/customers/:id/pause ──────────────────────────────────────────
const togglePause = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const today = getTodayString();

    if (customer.isPaused) {
      // Resume: close the last open pause period
      const lastPause = customer.pausePeriods[customer.pausePeriods.length - 1];
      if (lastPause && !lastPause.to) {
        lastPause.to = today;
      }
      customer.isPaused = false;
    } else {
      // Pause: open a new pause period
      customer.pausePeriods.push({ from: today, to: null });
      customer.isPaused = true;
    }

    await customer.save();
    res.json({
      success: true,
      message: customer.isPaused ? 'Customer paused' : 'Customer resumed',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/customers/:id/summary ──────────────────────────────────────────
const getCustomerSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query; // Optional: filter by month (MM) and year (YYYY)

    let dateFilter = { customerId: id, isDeleted: false };

    // Monthly filter: "2024-03"
    if (month && year) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      dateFilter.date = { $regex: `^${prefix}` };
    }

    const entries = await LedgerEntry.find(dateFilter).sort({ date: 1 });

    const totalDebit  = entries.filter((e) => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
    const totalCredit = entries.filter((e) => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
    const balance     = totalDebit - totalCredit;

    // Group by month for the monthly summary view
    const monthlyBreakdown = {};
    for (const entry of entries) {
      const key = entry.date.substring(0, 7); // "YYYY-MM"
      if (!monthlyBreakdown[key]) {
        monthlyBreakdown[key] = { month: key, debit: 0, credit: 0, balance: 0 };
      }
      if (entry.type === 'debit')  monthlyBreakdown[key].debit  += entry.amount;
      if (entry.type === 'credit') monthlyBreakdown[key].credit += entry.amount;
      monthlyBreakdown[key].balance = monthlyBreakdown[key].debit - monthlyBreakdown[key].credit;
    }

    res.json({
      success: true,
      data: {
        totalDebit,
        totalCredit,
        balance,
        entryCount: entries.length,
        monthlyBreakdown: Object.values(monthlyBreakdown).sort((a, b) =>
          b.month.localeCompare(a.month)
        ),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/customers/stats (dashboard stats) ───────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const pausedCustomers = await Customer.countDocuments({ isActive: true, isPaused: true });

    const allEntries = await LedgerEntry.find({ isDeleted: false });
    const totalDebit  = allEntries.filter((e) => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
    const totalCredit = allEntries.filter((e) => e.type === 'credit').reduce((s, e) => s + e.amount, 0);

    // Today's entries
    const today = getTodayString();
    const todayEntries = allEntries.filter((e) => e.date === today);
    const todayAmount = todayEntries.reduce((s, e) => {
      return e.type === 'debit' ? s + e.amount : s - e.amount;
    }, 0);

    res.json({
      success: true,
      data: {
        totalCustomers,
        pausedCustomers,
        activeCustomers: totalCustomers - pausedCustomers,
        totalDebit,
        totalCredit,
        totalBalance: totalDebit - totalCredit,
        todayAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  togglePause,
  getCustomerSummary,
  getDashboardStats,
};
