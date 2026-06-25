const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

app.use(cors());
app.use(express.json());

// الداتابيس اللي ف الذاكرة (Memory Database)
let database = {
  users: [],
  decisions: []
};

// 1. تسجيل جديد
app.post('/api/auth/signup', (req, res) => {
  database.users.push(req.body);
  res.json({ success: true, message: "تم التسجيل" });
});

// 2. حفظ القرارات
app.post('/api/decisions', (req, res) => {
  database.decisions.push(...req.body.decisions);
  res.json({ success: true, message: "تم الحفظ" });
});

// 3. جلب القرارات
app.get('/api/decisions', (req, res) => {
  res.json(database.decisions);
});

// تشغيل الـ Frontend
app.use(express.static(__dirname));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

module.exports = app;