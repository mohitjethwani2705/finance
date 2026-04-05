import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Finance Dashboard</h2>
        <p className="text-slate-500 text-sm mb-6">Sign in to your account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password123!"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5">
          <p className="text-xs text-slate-400 text-center mb-2">Quick login with demo accounts:</p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Admin', email: 'admin@example.com', password: 'Pass1234', color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
              { label: 'Analyst', email: 'analyst@example.com', password: 'Pass1234', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
              { label: 'Viewer', email: 'viewer@example.com', password: 'Pass1234', color: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' },
            ].map((cred) => (
              <button
                key={cred.label}
                type="button"
                onClick={() => { setEmail(cred.email); setPassword(cred.password); }}
                className={`w-full text-xs font-medium border rounded-lg px-3 py-2 transition-colors ${cred.color}`}
              >
                <span className="font-semibold">{cred.label}</span> — {cred.email} / {cred.password}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
