import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from storage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kb_token') || sessionStorage.getItem('kb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — unwrap data or throw a friendly error
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'Something went wrong';
    // If token is rejected by the server, clear stored token so UI redirects to login
    if (err.response?.status === 401) {
      localStorage.removeItem('kb_token');
      sessionStorage.removeItem('kb_token');
    }
    return Promise.reject(new Error(message));
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
};

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
  skipEntry:      (id)                 => api.patch(`/ledger/${id}/skip`),
  generateMissing: ()                  => api.post('/ledger/generate'),
};
