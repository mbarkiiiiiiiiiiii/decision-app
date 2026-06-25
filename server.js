const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

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