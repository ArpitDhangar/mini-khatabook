import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Setup() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]           = useState({ username: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      toast.error('All fields are required');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setSubmitting(true);
      const res = await authAPI.register({ username: form.username.trim(), password: form.password });
      login(res.token, true, res.data);
      toast.success('Account created! Welcome to Khatabook.');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📒</div>
          <h1 className="text-2xl font-bold text-gray-900">Khatabook Setup</h1>
          <p className="text-sm text-gray-500 mt-1">Create your admin account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Create Account</h2>
          <p className="text-xs text-gray-500 mb-5">This can only be done once.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="Choose a username"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input"
                placeholder="Repeat password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-blue-500 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
