import { Link } from 'react-router-dom';

/** Formats a number as Indian currency (₹) */
const fmt = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function CustomerCard({ customer, onTogglePause, onDelete }) {
  const { _id, name, phone, dailyAmount, isPaused, balance = 0, totalDebit = 0, totalCredit = 0 } = customer;

  return (
    <div className="card hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <Link
            to={`/customers/${_id}`}
            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-base leading-tight block truncate"
          >
            {name}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">📞 {phone}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isPaused && <span className="badge-yellow">Paused</span>}
          {!isPaused && <span className="badge-green">Active</span>}
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="bg-red-50 rounded-lg px-2 py-1.5">
          <p className="text-xs text-red-400">Debit</p>
          <p className="text-sm font-bold text-red-600">{fmt(totalDebit)}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg px-2 py-1.5">
          <p className="text-xs text-emerald-400">Credit</p>
          <p className="text-sm font-bold text-emerald-600">{fmt(totalCredit)}</p>
        </div>
        <div className={`rounded-lg px-2 py-1.5 ${balance > 0 ? 'bg-orange-50' : 'bg-blue-50'}`}>
          <p className="text-xs text-gray-400">Balance</p>
          <p className={`text-sm font-bold ${balance > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
            {fmt(balance)}
          </p>
        </div>
      </div>

      {/* Daily amount + actions */}
      <div className="flex items-center justify-between gap-2 mt-1 pt-3 border-t border-gray-50 flex-wrap">
        <span className="text-xs text-gray-500">
          Daily: <span className="font-semibold text-gray-700">{fmt(dailyAmount)}</span>
        </span>
        <div className="flex gap-1 flex-wrap justify-end">
          <button
            onClick={() => onTogglePause(_id, isPaused)}
            className={isPaused ? 'btn-success text-xs px-2 py-1' : 'btn-warning text-xs px-2 py-1'}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <Link to={`/customers/${_id}/edit`} className="btn-secondary text-xs px-2 py-1">
            Edit
          </Link>
          <Link to={`/customers/${_id}`} className="btn-primary text-xs px-2 py-1">
            Ledger
          </Link>
        </div>
      </div>
    </div>
  );
}
