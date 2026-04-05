import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400">
      <p className="text-6xl mb-4">404</p>
      <p className="text-lg font-semibold text-gray-600 mb-2">Page Not Found</p>
      <p className="text-sm mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary">Go to Dashboard</Link>
    </div>
  );
}
