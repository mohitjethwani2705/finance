import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';

function fmt(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const emptyForm = { title: '', amount: '', type: 'income', category: '', date: new Date().toISOString().split('T')[0], description: '' };

export default function Records() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', type: '', category: '', startDate: '', endDate: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState('');
  const [alert, setAlert] = useState(null);

  const load = async (p = page) => {
    const params = new URLSearchParams({ page: p, limit: 15 });
    if (filters.search) params.set('search', filters.search);
    if (filters.type) params.set('type', filters.type);
    if (filters.category) params.set('category', filters.category);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    const { data } = await api.get(`/records?${params}`);
    setRecords(data.data || []);
    setPagination(data.pagination || {});
    setPage(p);
  };

  useEffect(() => { load(1); }, []);

  const clearFilters = () => {
    setFilters({ search: '', type: '', category: '', startDate: '', endDate: '' });
    load(1);
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    const { data } = await api.get(`/records/${id}`);
    const r = data.data;
    setEditId(id);
    setForm({ title: r.title, amount: r.amount, type: r.type, category: r.category, date: r.date, description: r.description || '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = { ...form, amount: parseFloat(form.amount), description: form.description || undefined };
    try {
      if (editId) {
        await api.put(`/records/${editId}`, payload);
      } else {
        await api.post('/records', payload);
      }
      setModalOpen(false);
      load(page);
    } catch (err) {
      const d = err.response?.data;
      setFormError(d?.errors ? d.errors.map((e) => `${e.field}: ${e.message}`).join(', ') : d?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try {
      await api.delete(`/records/${id}`);
      load(page);
    } catch (err) {
      setAlert(err.response?.data?.message || 'Delete failed');
      setTimeout(() => setAlert(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Search</label>
            <input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Title, category..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
            <input
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              placeholder="e.g. Salary"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="min-w-[130px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">From</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="min-w-[130px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">To</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button onClick={() => load(1)} className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Filter
          </button>
          <button onClick={clearFilters} className="bg-slate-100 text-slate-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
            Clear
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Financial Records</h2>
        {user?.role !== 'viewer' && (
          <button onClick={openAdd} className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
            + Add Record
          </button>
        )}
      </div>

      {alert && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{alert}</div>}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b-2 border-slate-100">
              <th className="pb-3 pr-4">Title</th>
              <th className="pb-3 pr-4">Type</th>
              <th className="pb-3 pr-4">Amount</th>
              <th className="pb-3 pr-4">Category</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">By</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">No records found</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-700">{r.title}</div>
                    {r.description && <div className="text-xs text-slate-400 mt-0.5">{r.description.slice(0, 50)}{r.description.length > 50 ? '...' : ''}</div>}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className={`py-3 pr-4 font-semibold ${r.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${fmt(r.amount)}
                  </td>
                  <td className="py-3 pr-4 text-slate-500">{r.category}</td>
                  <td className="py-3 pr-4 text-slate-500">{r.date}</td>
                  <td className="py-3 pr-4 text-slate-500">{r.created_by_name}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      {user?.role !== 'viewer' && (
                        <button onClick={() => openEdit(r.id)} className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-md hover:bg-indigo-200 transition-colors">
                          Edit
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(r.id)} className="text-xs bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-md hover:bg-red-200 transition-colors">
                          Del
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-end gap-3 mt-4 text-sm">
            <span className="text-slate-400">Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)</span>
            {pagination.page > 1 && (
              <button onClick={() => load(pagination.page - 1)} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-200">
                Prev
              </button>
            )}
            {pagination.page < pagination.totalPages && (
              <button onClick={() => load(pagination.page + 1)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-indigo-700">
                Next
              </button>
            )}
          </div>
        )}
      </div>

      {/* Record Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Record' : 'Add Record'}>
        {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{formError}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Amount</label>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="bg-slate-100 text-slate-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-200">Cancel</button>
            <button type="submit" className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
