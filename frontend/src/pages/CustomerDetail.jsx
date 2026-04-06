import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customerAPI, ledgerAPI } from '../services/api';
import { generateBill } from '../utils/generateBill';
import LedgerTable from '../components/LedgerTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer]               = useState(null);
  const [summary, setSummary]                 = useState(null);
  const [entries, setEntries]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [entriesLoading, setEntriesLoading]   = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear]   = useState(String(now.getFullYear()));

  const [showPayment, setShowPayment]           = useState(false);
  const [paymentForm, setPaymentForm]           = useState({ amount: '', notes: '', date: todayStr() });
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

  const handleSkipEntry = async (entryId) => {
    try {
      const res = await ledgerAPI.skipEntry(entryId);
      toast.success(res.data.isSkipped ? 'Entry skipped' : 'Entry unskipped');
      loadEntries();
      loadSummary();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDownloadBill = () => {
    if (!entries.length) {
      toast.error('No entries for the selected month');
      return;
    }
    generateBill({ customer, entries, month, year });
  };

  if (loading) return <LoadingSpinner text="Loading customer ledger..." />;
  if (!customer) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-2">❓</p>
      <p>Customer not found</p>
      <Link to="/customers" className="btn-primary mt-4 inline-flex">Back to Customers</Link>
    </div>
  );

  const years  = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i));
  const months = [
    { v: '01', l: 'January'   }, { v: '02', l: 'February'  }, { v: '03', l: 'March'     },
    { v: '04', l: 'April'     }, { v: '05', l: 'May'        }, { v: '06', l: 'June'      },
    { v: '07', l: 'July'      }, { v: '08', l: 'August'     }, { v: '09', l: 'September' },
    { v: '10', l: 'October'   }, { v: '11', l: 'November'   }, { v: '12', l: 'December'  },
  ];

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link to="/customers" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
        ← Customers
      </Link>

      {/* ── Customer header card ── */}
      <div className="card space-y-3">
        {/* Name + status row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate leading-tight">
              {customer.name}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">📞 {customer.phone}</p>
            <p className="text-xs text-gray-500">
              Daily <span className="font-semibold text-gray-700">{fmt(customer.dailyAmount)}</span>
              &nbsp;· Since {customer.startDate}
            </p>
          </div>
          <span className={`shrink-0 mt-0.5 ${customer.isPaused ? 'badge-yellow' : 'badge-green'}`}>
            {customer.isPaused ? '⏸ Paused' : '▶ Active'}
          </span>
        </div>

        {/* Action buttons — 2-col grid on mobile, single row on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <button
            onClick={() => setShowPayment(true)}
            className="btn-primary text-xs py-2"
          >
            + Payment
          </button>
          <button
            onClick={handleTogglePause}
            className={`text-xs py-2 ${customer.isPaused ? 'btn-success' : 'btn-warning'}`}
          >
            {customer.isPaused ? 'Resume' : 'Pause'}
          </button>
          <Link to={`/customers/${id}/edit`} className="btn-secondary text-xs py-2 text-center">
            Edit Info
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger text-xs py-2"
          >
            Deactivate
          </button>
        </div>
      </div>

      {/* ── Financial summary ── */}
      {summary && (
        <div className="grid grid-cols-3 gap-2">
          {/* Debit */}
          <div className="card p-3 text-center border-l-4 border-l-red-400">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Debit</p>
            <p className="text-sm sm:text-lg font-bold text-red-600 mt-0.5 truncate">{fmt(summary.totalDebit)}</p>
          </div>
          {/* Paid */}
          <div className="card p-3 text-center border-l-4 border-l-emerald-400">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Paid</p>
            <p className="text-sm sm:text-lg font-bold text-emerald-600 mt-0.5 truncate">{fmt(summary.totalCredit)}</p>
          </div>
          {/* Balance */}
          <div className={`card p-3 text-center border-l-4 ${summary.balance > 0 ? 'border-l-orange-400' : 'border-l-blue-400'}`}>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Balance</p>
            <p className={`text-sm sm:text-lg font-bold mt-0.5 truncate ${summary.balance > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
              {fmt(summary.balance)}
            </p>
          </div>
        </div>
      )}

      {/* ── Ledger ── */}
      <div className="card">
        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h2 className="font-semibold text-gray-800 mr-1">Ledger</h2>
          <select
            className="input py-1.5 text-sm w-auto flex-1 min-w-[100px]"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {months.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
          <select
            className="input py-1.5 text-sm w-auto"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={handleDownloadBill}
            disabled={entriesLoading}
            className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap"
          >
            ↓ Bill
          </button>
        </div>

        <LedgerTable
          entries={entries}
          onSave={handleSaveEntry}
          onDelete={handleDeleteEntry}
          onSkip={handleSkipEntry}
          loading={entriesLoading}
        />
      </div>

      {/* ── Monthly breakdown ── */}
      {summary?.monthlyBreakdown?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Monthly Summary</h2>
          <div className="space-y-0.5">
            {summary.monthlyBreakdown.map((row) => (
              <div
                key={row.month}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 text-sm"
              >
                <span className="text-gray-700 font-medium text-xs sm:text-sm">{row.month}</span>
                <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm">
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

      {/* ── Add Payment Modal ── */}
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

      {/* ── Deactivate confirm ── */}
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
