const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const { Redis } = require('@upstash/redis'); // 👈 ضروري هادي
const path = require('path');

const app = express();
const redis = new Redis({ // 👈 الربط بالمتغيرات اللي ف Vercel
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
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
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'No token' });
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) return res.status(401).json({ success: false, message: 'Invalid token' });
  req.user = payload;
  next();
}

// 1. Sign Up
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (password !== confirmPassword) return res.status(400).json({ success: false, message: 'Mismatch' });
  
  const user = { id: Date.now(), name, email, password: hashPassword(password), role: 'user' };
  await redis.set(`user:${email}`, user); // 👈 حفظ ف الدفتر
  
  const token = generateToken(user.id, user.email, user.role);
  res.status(201).json({ success: true, token, user });
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await redis.get(`user:${email}`);
    if (!user || user.password !== hashPassword(password)) return res.status(401).json({ success: false, message: 'Invalid' });
    const token = generateToken(user.id, user.email, user.role);
    res.json({ success: true, token, user });
  } catch (err) { res.status(500).json({ success: false }); }
});

// 3. Save Decision (مربوط بـ ID ديال المستخدم)
app.post('/api/decisions', authMiddleware, async (req, res) => {
  const userId = req.user.userId; // كنجيبو الـ ID من الـ Token اللي ديجا تحققنا منو
  
  try {
    // 👈 كنجيبو القرارات الخاصة بهاد المستخدم بوحدو
    const oldDecisions = await redis.get(`decisions:${userId}`) || [];
    
    // كنزيدو عليهم الجداد
    const updated = [...oldDecisions, ...req.body.decisions];
    
    // 👈 كنحفظوهم ف بلاصة خاصة بهاد المستخدم
    await redis.set(`decisions:${userId}`, updated);
    
    res.json({ success: true, message: 'Saved!' });
  } catch (err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});