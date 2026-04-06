import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customerAPI, ledgerAPI } from '../services/api';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function Dashboard() {
  const [stats, setStats]         = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, customersRes] = await Promise.all([
        customerAPI.getStats(),
        customerAPI.getAll(),
      ]);
      setStats(statsRes.data);
      setCustomers(customersRes.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manually trigger missing entry generation
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await ledgerAPI.generateMissing();
      toast.success(res.message);
      await loadData(); // refresh stats
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  // Top 5 customers by outstanding balance
  const topDebtors = [...customers]
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-secondary text-xs shrink-0"
          title="Generate any missing daily entries"
        >
          {syncing ? '⏳ Syncing...' : '🔄 Sync'}
        </button>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatsCard
            label="Total Customers"
            value={stats.totalCustomers}
            subLabel={`${stats.activeCustomers} active, ${stats.pausedCustomers} paused`}
            color="bg-blue-100"
            icon="👥"
          />
          <StatsCard
            label="Total Balance Due"
            value={fmt(stats.totalBalance)}
            subLabel="Outstanding amount"
            color="bg-orange-100"
            icon="💰"
          />
          <StatsCard
            label="Total Debits"
            value={fmt(stats.totalDebit)}
            subLabel="All time"
            color="bg-red-100"
            icon="📉"
          />
          <StatsCard
            label="Total Payments"
            value={fmt(stats.totalCredit)}
            subLabel="All time"
            color="bg-emerald-100"
            icon="📈"
          />
        </div>
      )}

      {/* Today's summary */}
      {stats && (
        <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <p className="text-blue-100 text-xs sm:text-sm font-medium">Today's Total</p>
          <p className="text-2xl sm:text-3xl font-bold">{fmt(stats.todayAmount)}</p>
          <p className="text-blue-200 text-xs mt-1">Auto-debit for today's milk deliveries</p>
        </div>
      )}

      {/* Top debtors */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Top Outstanding Balances</h2>
          <Link to="/customers" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {topDebtors.length === 0 ? (
          <div className="card text-center text-gray-400 py-8">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm">No outstanding balances!</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-50">
            {topDebtors.map((c, i) => (
              <Link
                key={c._id}
                to={`/customers/${c._id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-4 px-4 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.phone}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-orange-600 text-sm">{fmt(c.balance)}</p>
                  {c.isPaused && <span className="badge-yellow text-xs">Paused</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
