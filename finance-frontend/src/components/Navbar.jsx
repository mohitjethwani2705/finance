import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { name: 'Dashboard', path: '/' },
  { name: 'Records', path: '/records' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-bold text-lg tracking-wide">Finance Dashboard</span>
          <div className="hidden sm:flex gap-1">
            {tabs.map((t) => (
              <Link
                key={t.path}
                to={t.path}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === t.path
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {t.name}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link
                to="/users"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/users'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Users
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            {user?.name} <span className="text-xs capitalize bg-slate-800 px-2 py-0.5 rounded-full">{user?.role}</span>
          </span>
          <button
            onClick={logout}
            className="text-sm border border-slate-600 px-3 py-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
