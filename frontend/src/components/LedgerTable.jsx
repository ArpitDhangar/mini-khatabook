import { useState } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

function EntryRow({ entry, onSave, onDelete, onSkip }) {
  const [editing, setEditing]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm]             = useState({
    amount: entry.amount,
    type: entry.type,
    notes: entry.notes || '',
  });

  const handleSave = () => {
    onSave(entry._id, form);
    setEditing(false);
  };

  const skipped = entry.isSkipped;

  return (
    <>
      <tr className={`border-b border-gray-50 transition-colors text-sm ${skipped ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}>

        {/* Date */}
        <td className="py-2 px-2 sm:px-3 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
          {entry.date}
        </td>

        {/* Type */}
        <td className="py-2 px-2 sm:px-3">
          <div className="flex flex-wrap gap-1 items-center">
            <span className={skipped ? 'badge-gray' : entry.type === 'debit' ? 'badge-red' : 'badge-green'}>
              {entry.type === 'debit' ? 'Dr' : 'Cr'}
            </span>
            {skipped && (
              <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">Skip</span>
            )}
            {entry.isAuto && !skipped && (
              <span className="badge-gray text-[10px] hidden sm:inline-flex">Auto</span>
            )}
          </div>
        </td>

        {/* Amount */}
        <td className={`py-2 px-2 sm:px-3 font-semibold whitespace-nowrap text-xs sm:text-sm ${
          skipped ? 'text-gray-400 line-through' : entry.type === 'debit' ? 'text-red-600' : 'text-emerald-600'
        }`}>
          {entry.type === 'debit' ? '-' : '+'}{fmt(entry.amount)}
        </td>

        {/* Notes — desktop only */}
        <td className="py-2 px-3 text-xs text-gray-400 max-w-[120px] truncate hidden sm:table-cell">
          {entry.notes || '—'}
        </td>

        {/* Actions */}
        <td className="py-2 px-2 sm:px-3 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-2">
            {!skipped && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => onSkip(entry._id)}
              className={`text-xs font-medium ${skipped ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-yellow-600'}`}
            >
              {skipped ? 'Unskip' : 'Skip'}
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-xs text-red-400 hover:text-red-600 font-medium"
            >
              Del
            </button>
          </div>
        </td>
      </tr>

      {/* Edit modal */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit Entry">
        <div className="space-y-3">
          <div>
            <label className="label">Amount (₹)</label>
            <input
              type="number"
              className="input"
              value={form.amount}
              min={0}
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <input
              type="text"
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional note..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => onDelete(entry._id)}
        title="Delete Entry"
        message="This will soft-delete the entry. The record is preserved but hidden. Continue?"
        confirmLabel="Delete"
        danger
      />
    </>
  );
}

export default function LedgerTable({ entries, onSave, onDelete, onSkip, loading }) {
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = entries.filter(
    (e) => typeFilter === 'all' || e.type === typeFilter
  );

  if (loading) {
    return <div className="text-center py-10 text-gray-400 text-sm">Loading entries...</div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-3xl mb-2">📭</p>
        <p className="text-sm">No entries found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-1.5 mb-3">
        {['all', 'debit', 'credit'].map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              typeFilter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} entries</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[320px]">
          <thead className="bg-gray-50 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="py-2 px-2 sm:px-3 text-left">Date</th>
              <th className="py-2 px-2 sm:px-3 text-left">Type</th>
              <th className="py-2 px-2 sm:px-3 text-left">Amount</th>
              <th className="py-2 px-3 text-left hidden sm:table-cell">Notes</th>
              <th className="py-2 px-2 sm:px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {filtered.map((entry) => (
              <EntryRow
                key={entry._id}
                entry={entry}
                onSave={onSave}
                onDelete={onDelete}
                onSkip={onSkip}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
