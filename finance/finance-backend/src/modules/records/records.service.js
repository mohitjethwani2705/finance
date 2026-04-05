const { getDb } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { PAGINATION, SORT } = require('../../config/constants');

function buildFilters(query) {
  const conditions = [];
  const params = [];

  if (query.type) { conditions.push('r.type = ?'); params.push(query.type); }
  if (query.category) { conditions.push('r.category LIKE ?'); params.push(`%${query.category}%`); }
  if (query.startDate) { conditions.push('r.date >= ?'); params.push(query.startDate); }
  if (query.endDate) { conditions.push('r.date <= ?'); params.push(query.endDate); }
  if (query.minAmount) { conditions.push('r.amount >= ?'); params.push(parseFloat(query.minAmount)); }
  if (query.maxAmount) { conditions.push('r.amount <= ?'); params.push(parseFloat(query.maxAmount)); }
  if (query.search) {
    conditions.push('(r.title LIKE ? OR r.description LIKE ? OR r.category LIKE ?)');
    const term = `%${query.search}%`;
    params.push(term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

const listRecords = async (query) => {
  const db = await getDb();
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  const sortBy = SORT.ALLOWED_BY.includes(query.sortBy) ? query.sortBy : SORT.DEFAULT_BY;
  const sortOrder = SORT.ALLOWED_ORDER.includes(query.sortOrder) ? query.sortOrder.toUpperCase() : SORT.DEFAULT_ORDER.toUpperCase();

  const { whereClause, params } = buildFilters(query);

  const countRow = await db.get(
    `SELECT COUNT(*) as total FROM financial_records r ${whereClause}`,
    ...params
  );

  const records = await db.all(
    `SELECT r.id, r.title, r.amount, r.type, r.category, r.date, r.description,
            r.created_by, u.name AS created_by_name, r.created_at, r.updated_at
     FROM financial_records r
     JOIN users u ON r.created_by = u.id
     ${whereClause}
     ORDER BY r.${sortBy} ${sortOrder}
     LIMIT ? OFFSET ?`,
    ...params, limit, offset
  );

  return { records, total: countRow.total, page, limit, totalPages: Math.ceil(countRow.total / limit) };
};

const getRecordById = async (id) => {
  const db = await getDb();
  const record = await db.get(
    `SELECT r.id, r.title, r.amount, r.type, r.category, r.date, r.description,
            r.created_by, u.name AS created_by_name, r.created_at, r.updated_at
     FROM financial_records r
     JOIN users u ON r.created_by = u.id
     WHERE r.id = ?`,
    id
  );

  if (!record) throw new ApiError(404, 'Financial record not found.');
  return record;
};

const createRecord = async (data, userId) => {
  const db = await getDb();
  const { title, amount, type, category, date, description } = data;

  const result = await db.run(
    'INSERT INTO financial_records (title, amount, type, category, date, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    title, amount, type, category, date, description || null, userId
  );

  return getRecordById(result.lastID);
};

const updateRecord = async (id, updates) => {
  const db = await getDb();
  const existing = await db.get('SELECT id FROM financial_records WHERE id = ?', id);
  if (!existing) throw new ApiError(404, 'Financial record not found.');

  const fields = [];
  const values = [];

  for (const key of ['title', 'amount', 'type', 'category', 'date', 'description']) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) throw new ApiError(400, 'No valid fields provided for update.');

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.run(`UPDATE financial_records SET ${fields.join(', ')} WHERE id = ?`, ...values);
  return getRecordById(id);
};

const deleteRecord = async (id) => {
  const db = await getDb();
  const existing = await db.get('SELECT id FROM financial_records WHERE id = ?', id);
  if (!existing) throw new ApiError(404, 'Financial record not found.');
  await db.run('DELETE FROM financial_records WHERE id = ?', id);
};

module.exports = { listRecords, getRecordById, createRecord, updateRecord, deleteRecord };
