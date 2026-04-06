import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customerAPI } from '../services/api';
import CustomerCard from '../components/CustomerCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all'); // all | active | paused

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerAPI.getAll();
      setCustomers(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePause = async (id, isPaused) => {
    try {
      await customerAPI.togglePause(id);
      toast.success(isPaused ? 'Customer resumed' : 'Customer paused');
      loadCustomers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Apply search + status filter
  const displayed = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'paused' && c.isPaused) ||
      (filter === 'active' && !c.isPaused);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          Customers <span className="text-gray-400 font-normal text-base ml-1">({customers.length})</span>
        </h1>
        <Link to="/customers/new" className="btn-primary text-xs sm:text-sm shrink-0">
          + Add
        </Link>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          className="input flex-1"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {['all', 'active', 'paused'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner />
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm">
            {customers.length === 0
              ? 'No customers yet. Add your first customer!'
              : 'No customers match your search.'}
          </p>
          {customers.length === 0 && (
            <Link to="/customers/new" className="btn-primary mt-4 inline-flex">
              + Add Customer
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {displayed.map((customer) => (
            <CustomerCard
              key={customer._id}
              customer={customer}
              onTogglePause={handleTogglePause}
            />
          ))}
        </div>
      )}
    </div>
  );
}
