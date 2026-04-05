const { getDb } = require('../../config/database');

const getSummary = async () => {
  const db = await getDb();
  const row = await db.get(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
      COUNT(*) AS total_records
    FROM financial_records
  `);

  return {
    total_income: row.total_income,
    total_expenses: row.total_expenses,
    net_balance: row.total_income - row.total_expenses,
    total_records: row.total_records,
  };
};

const getTrends = async (period = 'monthly') => {
  const db = await getDb();

  if (period === 'weekly') {
    const rows = await db.all(`
      SELECT
        strftime('%Y-W%W', date) AS period,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
      FROM financial_records
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `);
    return rows.reverse().map((r) => ({ ...r, net: r.income - r.expenses }));
  }

  const rows = await db.all(`
    SELECT
      strftime('%Y-%m', date) AS period,
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
    FROM financial_records
    GROUP BY period
    ORDER BY period DESC
    LIMIT 12
  `);

  return rows.reverse().map((r) => ({ ...r, net: r.income - r.expenses }));
};

const getCategoryBreakdown = async () => {
  const db = await getDb();
  const rows = await db.all(`
    SELECT
      category, type,
      COALESCE(SUM(amount), 0) AS total,
      COUNT(*) AS count
    FROM financial_records
    GROUP BY category, type
    ORDER BY total DESC
  `);

  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = {};
    grouped[row.category][row.type] = { total: row.total, count: row.count };
  }
  return grouped;
};

const getRecentActivity = async (limit = 5) => {
  const db = await getDb();
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit) || 5));

  return db.all(`
    SELECT r.id, r.title, r.amount, r.type, r.category, r.date,
           r.created_by, u.name AS created_by_name, r.created_at
    FROM financial_records r
    JOIN users u ON r.created_by = u.id
    ORDER BY r.created_at DESC
    LIMIT ?
  `, safeLimit);
};

const getTopCategories = async (limit = 5) => {
  const db = await getDb();
  const safeLimit = Math.min(20, Math.max(1, parseInt(limit) || 5));

  return db.all(`
    SELECT category, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
    FROM financial_records
    GROUP BY category
    ORDER BY total DESC
    LIMIT ?
  `, safeLimit);
};

module.exports = { getSummary, getTrends, getCategoryBreakdown, getRecentActivity, getTopCategories };
