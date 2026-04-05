import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — unwrap data or throw a friendly error
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ─── Customer API ─────────────────────────────────────────────────────────────
export const customerAPI = {
  getAll:         ()           => api.get('/customers'),
  getStats:       ()           => api.get('/customers/stats'),
  getOne:         (id)         => api.get(`/customers/${id}`),
  create:         (data)       => api.post('/customers', data),
  update:         (id, data)   => api.put(`/customers/${id}`, data),
  delete:         (id)         => api.delete(`/customers/${id}`),
  togglePause:    (id)         => api.patch(`/customers/${id}/pause`),
  getSummary:     (id, params) => api.get(`/customers/${id}/summary`, { params }),
};

// ─── Ledger API ───────────────────────────────────────────────────────────────
export const ledgerAPI = {
  getEntries:     (customerId, params) => api.get(`/ledger/${customerId}`, { params }),
  createEntry:    (data)               => api.post('/ledger', data),
  updateEntry:    (id, data)           => api.put(`/ledger/${id}`, data),
  deleteEntry:    (id)                 => api.delete(`/ledger/${id}`),
  generateMissing: ()                  => api.post('/ledger/generate'),
};
