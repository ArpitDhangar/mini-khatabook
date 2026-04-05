import { useState } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

/** Single editable row in the ledger */
function EntryRow({ entry, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    amount: entry.amount,
    type: entry.type,
    notes: entry.notes || '',
  });
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = () => {
    onSave(entry._id, form);
    setEditing(false);
  };

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
        {/* Date */}
        <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{entry.date}</td>

        {/* Type badge */}
        <td className="py-3 px-4">
          <span className={entry.type === 'debit' ? 'badge-red' : 'badge-green'}>
            {entry.type === 'debit' ? 'Debit' : 'Credit'}
          </span>
          {entry.isAuto && (
            <span className="badge-gray ml-1">Auto</span>
          )}
        </td>

        {/* Amount */}
        <td className={`py-3 px-4 text-sm font-semibold ${entry.type === 'debit' ? 'text-red-600' : 'text-emerald-600'}`}>
          {entry.type === 'debit' ? '-' : '+'}{fmt(entry.amount)}
        </td>

        {/* Notes */}
        <td className="py-3 px-4 text-sm text-gray-500 max-w-[160px] truncate">
          {entry.notes || '—'}
        </td>

        {/* Actions */}
        <td className="py-3 px-4 text-right whitespace-nowrap">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-500 hover:text-blue-700 mr-3 font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs text-red-400 hover:text-red-600 font-medium"
          >
            Delete
          </button>
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
            <button className="btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
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

/** Full ledger table with filtering */
export default function LedgerTable({ entries, onSave, onDelete, loading }) {
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = entries.filter(
    (e) => typeFilter === 'all' || e.type === typeFilter
  );

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">Loading entries...</div>
    );
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
      {/* Filter bar */}
      <div className="flex gap-2 mb-3">
        {['all', 'debit', 'credit'].map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              typeFilter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[500px]">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-left">Amount</th>
              <th className="py-3 px-4 text-left">Notes</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {filtered.map((entry) => (
              <EntryRow
                key={entry._id}
                entry={entry}
                onSave={onSave}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
