const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const { Redis } = require('@upstash/redis');
const path = require('path');

const app = express();

// إعداد الاتصال بـ Redis مع إضافة حماية في حالة غياب المتغيرات
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "", 
  token: process.env.KV_REST_API_TOKEN || "",
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// UTILITY FUNCTIONS
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(userId, email, role) {
  const payload = { userId, email, role, iat: Date.now(), exp: Date.now() + (7 * 24 * 60 * 60 * 1000) };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (error) { return null; }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ success: false, message: 'Invalid token' });
  req.user = payload;
  next();
}

// 1. Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) return res.status(400).json({ success: false, message: 'Mismatch' });
    
    const user = { id: Date.now(), name, email, password: hashPassword(password), role: 'user' };
    await redis.set(`user:${email}`, user);
    
    const token = generateToken(user.id, user.email, user.role);
    res.status(201).json({ success: true, token, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await redis.get(`user:${email}`);
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ success: false, message: 'Invalid' });
    }
    const token = generateToken(user.id, user.email, user.role);
    res.json({ success: true, token, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// 3. Save Decision
app.post('/api/decisions', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  try {
    const oldDecisions = await redis.get(`decisions:${userId}`) || [];
    const updated = [...oldDecisions, ...(req.body.decisions || [])];
    
    await redis.set(`decisions:${userId}`, updated);
    res.json({ success: true, message: 'Saved!' });
  } catch (err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// Vercel يحتاج أن نصدر التطبيق (Export)
module.exports = app;
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));