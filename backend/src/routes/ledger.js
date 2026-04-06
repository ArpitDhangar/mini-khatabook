const express = require('express');
const router = express.Router();
const {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  skipEntry,
  generateMissing,
} = require('../controllers/ledgerController');

// Generate missing entries (must be before /:id routes)
router.post('/generate', generateMissing);

// Get entries for a customer
router.get('/:customerId', getEntries);

// Create manual entry
router.post('/', createEntry);

// Edit / soft-delete / skip an entry
router.put('/:id',       updateEntry);
router.delete('/:id',    deleteEntry);
router.patch('/:id/skip', skipEntry);

module.exports = router;
