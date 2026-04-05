const mongoose = require('mongoose');

/**
 * Tracks daily amount changes over time.
 * When a shop owner changes the milk price from a specific date,
 * we store it here so historical entries remain accurate.
 */
const amountHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  from: { type: String, required: true }, // YYYY-MM-DD — effective from this date
}, { _id: false });

/**
 * Tracks pause periods. When a customer is paused (e.g., went on vacation),
 * no debit entries are generated for that period.
 */
const pausePeriodSchema = new mongoose.Schema({
  from: { type: String, required: true },  // YYYY-MM-DD — pause start
  to:   { type: String, default: null },   // YYYY-MM-DD — pause end (null = currently paused)
}, { _id: false });

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    dailyAmount: {
      type: Number,
      required: [true, 'Daily amount is required'],
      min: [0, 'Daily amount cannot be negative'],
    },
    startDate: {
      type: String, // YYYY-MM-DD — stored as string for timezone safety
      required: [true, 'Start date is required'],
    },
    autoEntryEnabled: {
      type: Boolean,
      default: true, // Auto-generate daily debit entries
    },
    isActive: {
      type: Boolean,
      default: true, // Soft-disable a customer without deleting
    },
    isPaused: {
      type: Boolean,
      default: false, // Currently paused?
    },
    pausePeriods: [pausePeriodSchema], // Full history of pauses

    // History of daily amount changes — newest entry takes precedence for any given date
    amountHistory: [amountHistorySchema],

    // The last date an auto-entry was successfully created for this customer.
    // Used to detect missing entries during recovery.
    lastEntryDate: {
      type: String, // YYYY-MM-DD
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast active-customer queries
customerSchema.index({ isActive: 1 });

module.exports = mongoose.model('Customer', customerSchema);
