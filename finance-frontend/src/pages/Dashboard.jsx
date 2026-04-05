import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function fmt(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [period, setPeriod] = useState('monthly');

  const isAnalyst = user?.role === 'analyst';

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/dashboard/trends?period=monthly'),
      api.get('/dashboard/top-categories?limit=5'),
      api.get('/dashboard/recent?limit=8'),
    ]).then(([s, t, c, r]) => {
      setSummary(s.data.data);
      setTrends(t.data.data);
      setTopCategories(c.data.data);
      setRecent(r.data.data);
    });
  }, []);

  const loadTrends = async (p) => {
    setPeriod(p);
    const { data } = await api.get(`/dashboard/trends?period=${p}`);
    setTrends(data.data);
  };

  if (!summary) return <div className="text-center py-20 text-slate-400">Loading...</div>;

  const maxTrend = Math.max(...trends.map((r) => Math.max(r.income, r.expenses)), 1);
  const maxCat = topCategories.length > 0 ? topCategories[0].total : 1;

  const pieData = [
    { name: 'Income', value: summary.total_income },
    { name: 'Expenses', value: summary.total_expenses },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Income" value={`$${fmt(summary.total_income)}`} color="text-emerald-600" />
        <SummaryCard title="Total Expenses" value={`$${fmt(summary.total_expenses)}`} color="text-red-600" />
        <SummaryCard title="Net Balance" value={`$${fmt(summary.net_balance)}`} color={summary.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'} />
        <SummaryCard title="Total Records" value={summary.total_records} color="text-slate-800" />
      </div>

      {/* Analyst-only Graphs */}
      {isAnalyst && (
        <>
          {/* Income vs Expenses Bar Chart + Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-700">Income vs Expenses</h2>
                <select
                  value={period}
                  onChange={(e) => loadTrends(e.target.value)}
                  className="text-sm border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `$${fmt(v)}`} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-slate-700 mb-4">Income vs Expenses Split</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip formatter={(v) => `$${fmt(v)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Net Balance Trend Line Chart */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-slate-700 mb-4">Net Balance Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `$${fmt(v)}`} />
                <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Net Balance" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-slate-700 mb-4">Top Categories Breakdown</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(v) => `$${fmt(v)}`} />
                <Bar dataKey="total" name="Amount" radius={[0, 4, 4, 0]}>
                  {topCategories.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Trends + Top Categories (non-graph view for admin/viewer) */}
      {!isAnalyst && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-700">Monthly Trends</h2>
              <select
                value={period}
                onChange={(e) => loadTrends(e.target.value)}
                className="text-sm border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="space-y-3">
              {trends.map((r) => (
                <div key={r.period}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{r.period}</span>
                    <span>
                      Net: <strong className={r.net >= 0 ? 'text-emerald-600' : 'text-red-600'}>${fmt(r.net)}</strong>
                    </span>
                  </div>
                  <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-slate-100">
                    <div className="bg-emerald-500 rounded-full" style={{ width: `${((r.income / maxTrend) * 100).toFixed(1)}%` }} />
                    <div className="bg-red-500 rounded-full" style={{ width: `${((r.expenses / maxTrend) * 100).toFixed(1)}%` }} />
                  </div>
                  <div className="flex gap-3 text-xs mt-1 text-slate-400">
                    <span className="text-emerald-600">+${fmt(r.income)}</span>
                    <span className="text-red-600">-${fmt(r.expenses)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-slate-700 mb-4">Top Categories</h2>
            <div className="space-y-3">
              {topCategories.map((r) => (
                <div key={r.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{r.category}</span>
                    <span className="font-medium text-slate-800">${fmt(r.total)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${((r.total / maxCat) * 100).toFixed(1)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b-2 border-slate-100">
                <th className="pb-3 pr-4">Title</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">No records yet</td></tr>
              ) : (
                recent.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-700">{r.title}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className={`py-3 pr-4 font-semibold ${r.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${fmt(r.amount)}
                    </td>
                    <td className="py-3 pr-4 text-slate-500">{r.category}</td>
                    <td className="py-3 text-slate-500">{r.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="text-sm text-slate-500 mb-1">{title}</h3>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
