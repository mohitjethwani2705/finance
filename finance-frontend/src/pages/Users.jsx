import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', role: 'viewer', is_active: true });
  const [formError, setFormError] = useState('');

  const load = async () => {
    const { data } = await api.get('/users');
    setUsers(data.data || []);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (u) => {
    setForm({ id: u.id, name: u.name, role: u.role, is_active: !!u.is_active });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.patch(`/users/${form.id}`, { name: form.name, role: form.role, is_active: form.is_active });
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  const roleBadge = (role) => {
    const styles = { admin: 'bg-violet-100 text-violet-700', analyst: 'bg-blue-100 text-blue-700', viewer: 'bg-slate-100 text-slate-600' };
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles[role] || styles.viewer}`}>{role}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">User Management</h2>
        <span className="text-sm bg-violet-100 text-violet-700 px-3 py-1 rounded-lg font-medium">Admin only</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b-2 border-slate-100">
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Role</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Joined</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 pr-4 font-medium text-slate-700">{u.name}</td>
                <td className="py-3 pr-4 text-slate-500">{u.email}</td>
                <td className="py-3 pr-4">{roleBadge(u.role)}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-slate-500">{u.created_at ? u.created_at.split('T')[0] : ''}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)} className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-md hover:bg-indigo-200 transition-colors">
                      Edit
                    </button>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => handleDelete(u.id)} className="text-xs bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-md hover:bg-red-200 transition-colors">
                        Del
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Edit User">
        {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{formError}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="viewer">Viewer</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Status</label>
            <select value={String(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="bg-slate-100 text-slate-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-200">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700">Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
