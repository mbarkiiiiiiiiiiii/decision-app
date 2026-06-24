// ============================================
// DECISION MANAGEMENT SYSTEM - BACKEND ENGINE
// ============================================
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// IN-MEMORY DATABASE (No MongoDB Required)
// ============================================
const database = {
  users: [],
  decisions: [],
  nextDecisionId: 1
};

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

// MIDDLEWARE
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ success: false, message: 'Invalid token' });
  req.user = payload;
  next();
}

// ============================================
// API ROUTES
// ============================================

// 1. Sign Up
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }
  const existingUser = database.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const user = {
    id: database.users.length + 1,
    name, email, password: hashPassword(password), role: 'user', createdAt: new Date()
  };
  database.users.push(user);

  const token = generateToken(user.id, user.email, user.role);
  res.status(201).json({ success: true, message: 'User registered successfully', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// 2. Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  const user = database.users.find(u => u.email === email);
  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  const token = generateToken(user.id, user.email, user.role);
  res.json({ success: true, message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// 3. Save Decision
app.post('/api/decisions', authMiddleware, (req, res) => {
  const { decisions } = req.body; // نتقبل مصفوفة من القرارات دفعة واحدة
  if (!decisions || !Array.isArray(decisions)) {
    return res.status(400).json({ success: false, message: 'Invalid decisions format' });
  }

  decisions.forEach(d => {
    database.decisions.push({
      id: database.nextDecisionId++,
      userId: req.user.userId,
      decisionNumber: d.decisionNumber,
      decisionDate: d.decisionDate,
      subject: d.subject,
      recipientEntity: d.recipient,
      receiptDate: d.receivedDate || null,
      remarks: d.notes || '',
      createdAt: new Date()
    });
  });

  console.log("=== Saved Decisions f Database ===", database.decisions);
  res.status(201).json({ success: true, message: 'Decisions saved successfully' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const path = require('path');
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});