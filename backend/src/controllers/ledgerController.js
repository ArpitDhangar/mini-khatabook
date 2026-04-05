const LedgerEntry = require('../models/LedgerEntry');
const Customer = require('../models/Customer');
const { generateAllMissingEntries, generateMissingEntriesForCustomer } = require('../services/autoEntryService');

// ─── GET /api/ledger/:customerId ──────────────────────────────────────────────
const getEntries = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { month, year, type, page = 1, limit = 50 } = req.query;

    // Trigger fallback entry generation for this customer before returning data
    await generateMissingEntriesForCustomer(customerId);

    let filter = { customerId, isDeleted: false };

    if (month && year) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      filter.date = { $regex: `^${prefix}` };
    }

    if (type && ['debit', 'credit'].includes(type)) {
      filter.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      LedgerEntry.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LedgerEntry.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ledger (manual entry — e.g., payment received) ────────────────
const createEntry = async (req, res, next) => {
  try {
    const { customerId, date, amount, type, notes } = req.body;

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const entry = await LedgerEntry.create({
      customerId,
      date,
      amount,
      type,
      isAuto: false,
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/ledger/:id ──────────────────────────────────────────────────────
const updateEntry = async (req, res, next) => {
  try {
    const entry = await LedgerEntry.findById(req.params.id);
    if (!entry || entry.isDeleted) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    const { amount, type, notes, date } = req.body;

    // Save audit trail before modifying
    entry.editHistory.push({
      editedAt: new Date(),
      previousAmount: entry.amount,
      previousType: entry.type,
      previousNotes: entry.notes,
    });

    if (amount !== undefined) entry.amount = amount;
    if (type !== undefined)   entry.type   = type;
    if (notes !== undefined)  entry.notes  = notes;
    if (date !== undefined)   entry.date   = date;

    await entry.save();
    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/ledger/:id (soft delete) ────────────────────────────────────
const deleteEntry = async (req, res, next) => {
  try {
    const entry = await LedgerEntry.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, message: 'Entry deleted (soft)' });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ledger/generate (fallback: generate missing entries for all) ───
const generateMissing = async (req, res, next) => {
  try {
    const result = await generateAllMissingEntries();
    res.json({
      success: true,
      message: `Generated ${result.total} entries for ${result.customers} customers`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  generateMissing,
};
