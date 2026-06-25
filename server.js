const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());

// هادي هي الداتابيس ديالنا، مخبية غير ف الرام (الذاكرة)
let database = {
  users: [],
  decisions: []
};

// 1. تسجيل جديد
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  database.users.push({ name, email, password });
  res.json({ success: true, message: "تم التسجيل" });
});

// 2. حفظ القرارات
app.post('/api/decisions', (req, res) => {
  database.decisions.push(req.body);
  res.json({ success: true, message: "تم الحفظ" });
});

// 3. قراءة القرارات
app.get('/api/decisions', (req, res) => {
  res.json(database.decisions);
});

// تشغيل الـ Frontend
app.use(express.static(__dirname));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

module.exports = app;