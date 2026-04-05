import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customerAPI, ledgerAPI } from '../services/api';
import LedgerTable from '../components/LedgerTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// Get YYYY-MM-DD for today
const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer]     = useState(null);
  const [summary, setSummary]       = useState(null);
  const [entries, setEntries]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // Month/year filter
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear]   = useState(String(now.getFullYear()));

  // Manual payment modal
  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', notes: '', date: todayStr() });

  // Delete customer confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadCustomer = useCallback(async () => {
    try {
      const res = await customerAPI.getOne(id);
      setCustomer(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  }, [id]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await customerAPI.getSummary(id, { month, year });
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [id, month, year]);

  const loadEntries = useCallback(async () => {
    try {
      setEntriesLoading(true);
      // The backend auto-generates missing entries when fetching
      const res = await ledgerAPI.getEntries(id, { month, year, limit: 100 });
      setEntries(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEntriesLoading(false);
    }
  }, [id, month, year]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadCustomer(), loadSummary(), loadEntries()]);
      setLoading(false);
    };
    init();
  }, [loadCustomer, loadSummary, loadEntries]);

  // Re-fetch summary + entries when month/year filter changes
  useEffect(() => {
    if (!loading) {
      loadSummary();
      loadEntries();
    }
  }, [month, year]);

  const handleTogglePause = async () => {
    try {
      await customerAPI.togglePause(id);
      toast.success(customer.isPaused ? 'Customer resumed' : 'Customer paused');
      loadCustomer();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      await customerAPI.delete(id);
      toast.success('Customer deactivated');
      navigate('/customers');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await ledgerAPI.createEntry({
        customerId: id,
        date: paymentForm.date,
        amount: parseFloat(paymentForm.amount),
        type: 'credit',
        notes: paymentForm.notes,
      });
      toast.success('Payment recorded');
      setShowPayment(false);
      setPaymentForm({ amount: '', notes: '', date: todayStr() });
      loadEntries();
      loadSummary();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveEntry = async (entryId, data) => {
    try {
      await ledgerAPI.updateEntry(entryId, data);
      toast.success('Entry updated');
      loadEntries();
      loadSummary();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      await ledgerAPI.deleteEntry(entryId);
      toast.success('Entry deleted');
      loadEntries();
      loadSummary();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <LoadingSpinner text="Loading customer ledger..." />;
  if (!customer) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-2">❓</p>
      <p>Customer not found</p>
      <Link to="/customers" className="btn-primary mt-4 inline-flex">Back to Customers</Link>
    </div>
  );

  // Build month/year selector options
  const years  = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i));
  const months = [
    { v: '01', l: 'January'   }, { v: '02', l: 'February'  }, { v: '03', l: 'March'     },
    { v: '04', l: 'April'     }, { v: '05', l: 'May'        }, { v: '06', l: 'June'      },
    { v: '07', l: 'July'      }, { v: '08', l: 'August'     }, { v: '09', l: 'September' },
    { v: '10', l: 'October'   }, { v: '11', l: 'November'   }, { v: '12', l: 'December'  },
  ];

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link to="/customers" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
        ← Back to Customers
      </Link>

      {/* Customer header card */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">📞 {customer.phone}</p>
            <p className="text-sm text-gray-500">
              Daily: <span className="font-semibold text-gray-700">{fmt(customer.dailyAmount)}</span>
              &nbsp;· Since {customer.startDate}
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {customer.isPaused
              ? <span className="badge-yellow">⏸ Paused</span>
              : <span className="badge-green">▶ Active</span>
            }
            <button
              onClick={handleTogglePause}
              className={customer.isPaused ? 'btn-success text-xs' : 'btn-warning text-xs'}
            >
              {customer.isPaused ? 'Resume' : 'Pause'}
            </button>
            <Link to={`/customers/${id}/edit`} className="btn-secondary text-xs">Edit</Link>
            <button onClick={() => setShowPayment(true)} className="btn-primary text-xs">
              + Payment
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger text-xs">
              Deactivate
            </button>
          </div>
        </div>
      </div>

      {/* Financial summary strip */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Debit</p>
            <p className="text-xl font-bold text-red-600 mt-1">{fmt(summary.totalDebit)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Paid</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{fmt(summary.totalCredit)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Balance Due</p>
            <p className={`text-xl font-bold mt-1 ${summary.balance > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
              {fmt(summary.balance)}
            </p>
          </div>
        </div>
      )}

      {/* Month/Year selector + Monthly breakdown */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <h2 className="font-semibold text-gray-800 mr-2">Ledger</h2>
          <select className="input w-auto text-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
          <select className="input w-auto text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <LedgerTable
          entries={entries}
          onSave={handleSaveEntry}
          onDelete={handleDeleteEntry}
          loading={entriesLoading}
        />
      </div>

      {/* Monthly breakdown accordion */}
      {summary?.monthlyBreakdown?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Monthly Summary</h2>
          <div className="space-y-2">
            {summary.monthlyBreakdown.map((row) => (
              <div key={row.month} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                <span className="text-gray-700 font-medium">{row.month}</span>
                <div className="flex gap-4">
                  <span className="text-red-500">{fmt(row.debit)}</span>
                  <span className="text-emerald-500">{fmt(row.credit)}</span>
                  <span className={`font-bold ${row.balance > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                    {fmt(row.balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Record Payment">
        <form onSubmit={handleAddPayment} className="space-y-3">
          <div>
            <label className="label">Amount (₹)</label>
            <input
              type="number"
              className="input"
              placeholder="Enter amount"
              value={paymentForm.amount}
              min={0}
              required
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={paymentForm.date}
              required
              onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Cash received"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowPayment(false)}>Cancel</button>
            <button type="submit" className="btn-success">Record Payment</button>
          </div>
        </form>
      </Modal>

      {/* Deactivate confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteCustomer}
        title="Deactivate Customer"
        message={`Are you sure you want to deactivate ${customer.name}? They will no longer receive daily entries. All existing data is preserved.`}
        confirmLabel="Deactivate"
        danger
      />
    </div>
  );
}
