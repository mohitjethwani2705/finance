const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDb } = require('../../config/database');
const ApiError = require('../../utils/ApiError');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function getRefreshTokenExpiry() {
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) || 7;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

const register = async (name, email, password) => {
  const db = await getDb();

  const existing = await db.get('SELECT id FROM users WHERE email = ?', email);
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await db.run(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    name, email, hashedPassword
  );

  return db.get(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
    result.lastID
  );
};

const login = async (email, password) => {
  const db = await getDb();

  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.is_active) {
    throw new ApiError(401, 'Your account has been deactivated. Contact an administrator.');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiry();

  await db.run(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    user.id, refreshToken, expiresAt
  );

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

const refresh = async (refreshToken) => {
  const db = await getDb();

  const stored = await db.get('SELECT * FROM refresh_tokens WHERE token = ?', refreshToken);
  if (!stored) {
    throw new ApiError(401, 'Invalid refresh token.');
  }

  if (new Date(stored.expires_at) < new Date()) {
    await db.run('DELETE FROM refresh_tokens WHERE id = ?', stored.id);
    throw new ApiError(401, 'Refresh token has expired. Please log in again.');
  }

  const user = await db.get('SELECT id, email, role, is_active FROM users WHERE id = ?', stored.user_id);
  if (!user || !user.is_active) {
    throw new ApiError(401, 'User account not found or deactivated.');
  }

  // Rotate refresh token
  const newRefreshToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiry();

  await db.run('DELETE FROM refresh_tokens WHERE id = ?', stored.id);
  await db.run(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    user.id, newRefreshToken, expiresAt
  );

  return {
    accessToken: generateAccessToken(user),
    refreshToken: newRefreshToken,
  };
};

const logout = async (refreshToken) => {
  const db = await getDb();
  await db.run('DELETE FROM refresh_tokens WHERE token = ?', refreshToken);
};

module.exports = { register, login, refresh, logout };
