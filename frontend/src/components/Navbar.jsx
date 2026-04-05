import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-blue-600 text-lg">
          <span className="text-2xl">📒</span>
          <span>Khatabook</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <NavLink to="/"          end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/customers"     className={linkClass}>Customers</NavLink>
          <Link
            to="/customers/new"
            className="btn-primary ml-2 text-xs sm:text-sm"
          >
            + Add Customer
          </Link>
        </nav>
      </div>
    </header>
  );
}
