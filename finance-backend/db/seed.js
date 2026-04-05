require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb } = require('../src/config/database');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

async function seed() {
  const db = await getDb();
  console.log('Seeding database...\n');

  const users = [
    { name: 'Alice Admin',   email: 'admin@example.com',   password: 'Pass1234',   role: 'admin' },
    { name: 'Anna Analyst',  email: 'analyst@example.com', password: 'Pass1234', role: 'analyst' },
    { name: 'Victor Viewer', email: 'viewer@example.com',  password: 'Pass1234',  role: 'viewer' },
  ];

  const userIds = {};
  for (const u of users) {
    const existing = await db.get('SELECT id FROM users WHERE email = ?', u.email);
    if (existing) {
      userIds[u.role] = existing.id;
      console.log(`  Skipped (exists): ${u.email}`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
    const result = await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      u.name, u.email, hash, u.role
    );
    userIds[u.role] = result.lastID;
    console.log(`  Created ${u.role}: ${u.email} / ${u.password}`);
  }

  const adminId = userIds['admin'];
  const analystId = userIds['analyst'];

  const records = [
    { title: 'Monthly Salary',      amount: 5000, type: 'income',  category: 'Salary',      date: '2026-01-01', description: 'Regular monthly salary',  created_by: adminId },
    { title: 'Monthly Salary',      amount: 5000, type: 'income',  category: 'Salary',      date: '2026-02-01', description: 'Regular monthly salary',  created_by: adminId },
    { title: 'Monthly Salary',      amount: 5200, type: 'income',  category: 'Salary',      date: '2026-03-01', description: 'Salary with raise',        created_by: adminId },
    { title: 'Freelance Project A', amount: 1200, type: 'income',  category: 'Freelance',   date: '2026-01-15', description: 'Web design project',      created_by: analystId },
    { title: 'Freelance Project B', amount: 800,  type: 'income',  category: 'Freelance',   date: '2026-02-20', description: 'Logo design',              created_by: analystId },
    { title: 'Consulting Fee',      amount: 2000, type: 'income',  category: 'Freelance',   date: '2026-03-10', description: 'Strategy consulting',      created_by: analystId },
    { title: 'Equipment Sale',      amount: 500,  type: 'income',  category: 'Equipment',   date: '2026-01-28', description: 'Sold old laptop',          created_by: adminId },
    { title: 'Office Rent',         amount: 1500, type: 'expense', category: 'Rent',        date: '2026-01-01', description: 'Monthly office rent',      created_by: adminId },
    { title: 'Office Rent',         amount: 1500, type: 'expense', category: 'Rent',        date: '2026-02-01', description: 'Monthly office rent',      created_by: adminId },
    { title: 'Office Rent',         amount: 1500, type: 'expense', category: 'Rent',        date: '2026-03-01', description: 'Monthly office rent',      created_by: adminId },
    { title: 'Electricity Bill',    amount: 120,  type: 'expense', category: 'Utilities',   date: '2026-01-10', description: 'January electricity',      created_by: analystId },
    { title: 'Electricity Bill',    amount: 135,  type: 'expense', category: 'Utilities',   date: '2026-02-10', description: 'February electricity',     created_by: analystId },
    { title: 'Internet Service',    amount: 80,   type: 'expense', category: 'Utilities',   date: '2026-01-05', description: 'Monthly internet',         created_by: analystId },
    { title: 'Internet Service',    amount: 80,   type: 'expense', category: 'Utilities',   date: '2026-02-05', description: 'Monthly internet',         created_by: analystId },
    { title: 'Internet Service',    amount: 80,   type: 'expense', category: 'Utilities',   date: '2026-03-05', description: 'Monthly internet',         created_by: analystId },
    { title: 'Office Supplies',     amount: 250,  type: 'expense', category: 'Equipment',   date: '2026-01-20', description: 'Printer paper and pens',   created_by: adminId },
    { title: 'New Laptop',          amount: 1200, type: 'expense', category: 'Equipment',   date: '2026-02-15', description: 'MacBook for development',  created_by: adminId },
    { title: 'Marketing Campaign',  amount: 600,  type: 'expense', category: 'Marketing',   date: '2026-01-25', description: 'Google Ads campaign',      created_by: analystId },
    { title: 'Social Media Ads',    amount: 300,  type: 'expense', category: 'Marketing',   date: '2026-02-25', description: 'Facebook & Instagram',     created_by: analystId },
    { title: 'Conference Travel',   amount: 450,  type: 'expense', category: 'Travel',      date: '2026-03-15', description: 'Tech conference airfare',  created_by: adminId },
    { title: 'Team Lunch',          amount: 180,  type: 'expense', category: 'Groceries',   date: '2026-02-14', description: "Valentine's team event",   created_by: adminId },
    { title: 'Health Insurance',    amount: 350,  type: 'expense', category: 'Healthcare',  date: '2026-01-01', description: 'Monthly health premium',   created_by: adminId },
    { title: 'Health Insurance',    amount: 350,  type: 'expense', category: 'Healthcare',  date: '2026-02-01', description: 'Monthly health premium',   created_by: adminId },
    { title: 'Health Insurance',    amount: 350,  type: 'expense', category: 'Healthcare',  date: '2026-03-01', description: 'Monthly health premium',   created_by: adminId },
    { title: 'Team Building Event', amount: 500,  type: 'expense', category: 'Entertainment', date: '2026-03-20', description: 'Annual team outing',    created_by: adminId },
  ];

  let inserted = 0;
  for (const r of records) {
    await db.run(
      'INSERT INTO financial_records (title, amount, type, category, date, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      r.title, r.amount, r.type, r.category, r.date, r.description, r.created_by
    );
    inserted++;
  }

  console.log(`\n  Inserted ${inserted} financial records.`);
  console.log('\nSeed complete!\n');
  console.log('Test credentials:');
  console.log('  admin@example.com   / Pass1234 (role: admin)');
  console.log('  analyst@example.com / Pass1234 (role: analyst)');
  console.log('  viewer@example.com  / Pass1234 (role: viewer)');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
