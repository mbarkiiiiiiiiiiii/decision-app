const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());

// التعديل هنا: استخدام __dirname باش يلقى index.html فين ما كان
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// باقي الكود ديالك...
// البيانات في الذاكرة (مؤقتة)
let database = { users: [], decisions: [] };

app.post('/api/auth/signup', (req, res) => {
    database.users.push(req.body);
    res.json({ success: true });
});

app.post('/api/decisions', (req, res) => {
    database.decisions.push(...req.body.decisions);
    res.json({ success: true });
});

app.get('/api/decisions', (req, res) => {
    res.json(database.decisions);
});

// هذا السطر مهم جداً لـ Vercel
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

module.exports = app;