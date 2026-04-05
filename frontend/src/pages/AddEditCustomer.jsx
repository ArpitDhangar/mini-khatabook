import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customerAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Today as YYYY-MM-DD
const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const INITIAL_FORM = {
  name:             '',
  phone:            '',
  dailyAmount:      '',
  startDate:        todayStr(),
  autoEntryEnabled: true,
  // For amount change (edit mode only)
  newAmountFrom:    todayStr(),
};

export default function AddEditCustomer() {
  const { id }    = useParams(); // present when editing
  const navigate  = useNavigate();
  const isEdit    = Boolean(id);

  const [form, setForm]         = useState(INITIAL_FORM);
  const [loading, setLoading]   = useState(isEdit); // fetch data only in edit mode
  const [saving, setSaving]     = useState(false);
  const [showAmountChange, setShowAmountChange] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await customerAPI.getOne(id);
        const c   = res.data;
        setForm({
          name:             c.name,
          phone:            c.phone,
          dailyAmount:      c.dailyAmount,
          startDate:        c.startDate,
          autoEntryEnabled: c.autoEntryEnabled,
          newAmountFrom:    todayStr(),
        });
      } catch (err) {
        toast.error(err.message);
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate]);

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim())     return toast.error('Name is required');
    if (!form.phone.trim())    return toast.error('Phone is required');
    if (!form.dailyAmount || parseFloat(form.dailyAmount) < 0)
      return toast.error('Enter a valid daily amount');

    setSaving(true);
    try {
      const payload = {
        name:             form.name.trim(),
        phone:            form.phone.trim(),
        dailyAmount:      parseFloat(form.dailyAmount),
        startDate:        form.startDate,
        autoEntryEnabled: form.autoEntryEnabled,
      };

      // In edit mode, attach the effective-from date for amount changes
      if (isEdit && showAmountChange) {
        payload.newAmountFrom = form.newAmountFrom;
      }

      if (isEdit) {
        await customerAPI.update(id, payload);
        toast.success('Customer updated successfully');
        navigate(`/customers/${id}`);
      } else {
        const res = await customerAPI.create(payload);
        toast.success('Customer added successfully');
        navigate(`/customers/${res.data._id}`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading customer details..." />;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Back link */}
      <Link
        to={isEdit ? `/customers/${id}` : '/customers'}
        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
      >
        ← {isEdit ? 'Back to Ledger' : 'Back to Customers'}
      </Link>

      {/* Form card */}
      <div className="card">
        <h1 className="text-lg font-bold text-gray-900 mb-5">
          {isEdit ? '✏️ Edit Customer' : '➕ Add New Customer'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="label">Full Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Ramesh Kumar"
              value={form.name}
              onChange={set('name')}
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="label">Phone Number *</label>
            <input
              type="tel"
              className="input"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={set('phone')}
              required
            />
          </div>

          {/* Daily Amount */}
          <div>
            <label className="label">Daily Amount (₹) *</label>
            {isEdit && (
              <label className="flex items-center gap-2 text-sm text-gray-500 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAmountChange}
                  onChange={(e) => setShowAmountChange(e.target.checked)}
                  className="rounded"
                />
                Change amount from a specific date
              </label>
            )}
            <input
              type="number"
              className="input"
              placeholder="e.g. 50"
              value={form.dailyAmount}
              min={0}
              step="0.01"
              onChange={set('dailyAmount')}
              required
            />
            {/* Effective from date — shown only in edit mode when toggled */}
            {isEdit && showAmountChange && (
              <div className="mt-2">
                <label className="label text-xs">Effective From</label>
                <input
                  type="date"
                  className="input"
                  value={form.newAmountFrom}
                  onChange={set('newAmountFrom')}
                />
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ New amount applies to entries on and after this date.
                  Historical entries are not affected.
                </p>
              </div>
            )}
          </div>

          {/* Start Date (new customer only) */}
          {!isEdit && (
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={set('startDate')}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Daily entries will be generated starting from this date.
              </p>
            </div>
          )}

          {/* Auto entry toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Auto Daily Entries</p>
              <p className="text-xs text-gray-400">Automatically create daily debit entries</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.autoEntryEnabled}
                onChange={set('autoEntryEnabled')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Link
              to={isEdit ? `/customers/${id}` : '/customers'}
              className="btn-secondary flex-1 justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
