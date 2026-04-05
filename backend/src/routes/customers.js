const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  togglePause,
  getCustomerSummary,
  getDashboardStats,
} = require('../controllers/customerController');

// Dashboard stats (must be before /:id routes)
router.get('/stats', getDashboardStats);

// CRUD
router.get('/',    getAllCustomers);
router.post('/',   createCustomer);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

// Special actions
router.patch('/:id/pause',   togglePause);
router.get('/:id/summary',   getCustomerSummary);

module.exports = router;
