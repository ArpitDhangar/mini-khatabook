import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `block text-sm font-medium px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-700 hover:bg-gray-50'
    }`;

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
    close();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      {/* Main bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-blue-600 text-lg" onClick={close}>
          <span className="text-2xl">📒</span>
          <span>Khatabook</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/customers" className={linkClass}>Customers</NavLink>
          <Link to="/customers/new" className="btn-primary ml-2 text-xs sm:text-sm">
            + Add
          </Link>
          {user && (
            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-gray-200">
              <span className="text-xs text-gray-500">{user.username}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </nav>

        {/* Mobile: + button + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link to="/customers/new" onClick={close} className="btn-primary text-xs px-3 py-1.5">
            + Add
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? (
              /* X icon */
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-3 pb-3 pt-2 space-y-1">
          <NavLink to="/" end className={mobileLinkClass} onClick={close}>Dashboard</NavLink>
          <NavLink to="/customers" className={mobileLinkClass} onClick={close}>Customers</NavLink>
          {user && (
            <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between px-1">
              <span className="text-xs text-gray-400">{user.username}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
