const { getDb } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { PAGINATION } = require('../../config/constants');

const listUsers = async (page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) => {
  const db = await getDb();
  const offset = (page - 1) * limit;

  const users = await db.all(
    'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
    limit, offset
  );
  const row = await db.get('SELECT COUNT(*) as total FROM users');

  return { users, total: row.total, page, limit, totalPages: Math.ceil(row.total / limit) };
};

const getUserById = async (id) => {
  const db = await getDb();
  const user = await db.get(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
    id
  );

  if (!user) throw new ApiError(404, 'User not found.');
  return user;
};

const updateUser = async (id, updates) => {
  const db = await getDb();

  const user = await db.get('SELECT id FROM users WHERE id = ?', id);
  if (!user) throw new ApiError(404, 'User not found.');

  const fields = [];
  const values = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role); }
  if (updates.is_active !== undefined) { fields.push('is_active = ?'); values.push(updates.is_active ? 1 : 0); }

  if (fields.length === 0) throw new ApiError(400, 'No valid fields provided for update.');

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, ...values);

  return db.get(
    'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
    id
  );
};

const deleteUser = async (id, requesterId) => {
  if (id === requesterId) throw new ApiError(400, 'You cannot delete your own account.');

  const db = await getDb();
  const user = await db.get('SELECT id FROM users WHERE id = ?', id);
  if (!user) throw new ApiError(404, 'User not found.');

  await db.run('DELETE FROM refresh_tokens WHERE user_id = ?', id);
  await db.run('DELETE FROM users WHERE id = ?', id);
};

module.exports = { listUsers, getUserById, updateUser, deleteUser };
