const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// Secret key for JWT
const JWT_SECRET = "SUPER_SECRET_KEY_CHANGE_THIS";

// In-memory admin user (upgrade later)
let adminUser = {
    username: "admin",
    passwordHash: bcrypt.hashSync("admin123", 10) // default password
};

// In-memory license database
let licenses = {
    "TEST-KEY-123": { active: true, hwid: null }
};

// Root route
app.get('/', (req, res) => {
    res.send('Optimizer backend online ✅');
});

// ---------------- AUTH MIDDLEWARE ----------------
function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(403).json({ error: "Invalid token" });
    }
}

// ---------------- LOGIN ROUTE ----------------
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username !== adminUser.username)
        return res.json({ success: false });

    if (!bcrypt.compareSync(password, adminUser.passwordHash))
        return res.json({ success: false });

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "2h" });

    res.json({ success: true, token });
});

// ---------------- LICENSE VALIDATION ----------------
app.post('/api/license/validate', (req, res) => {
    const { key, hwid } = req.body;

    if (!licenses[key] || !licenses[key].active)
        return res.json({ valid: false });

    if (!licenses[key].hwid) {
        licenses[key].hwid = hwid;
        return res.json({ valid: true });
    }

    if (licenses[key].hwid !== hwid)
        return res.json({ valid: false });

    res.json({ valid: true });
});

// ---------------- ADMIN ROUTES (PROTECTED) ----------------

// Generate new license key
app.post('/api/admin/generate-key', auth, (req, res) => {
    const newKey = uuidv4().toUpperCase();
    licenses[newKey] = { active: true, hwid: null };
    res.json({ key: newKey });
});

// Disable a key
app.post('/api/admin/disable-key', auth, (req, res) => {
    const { key } = req.body;
    if (!licenses[key]) return res.json({ success: false });
    licenses[key].active = false;
    res.json({ success: true });
});

// Reset HWID
app.post('/api/admin/reset-hwid', auth, (req, res) => {
    const { key } = req.body;
    if (!licenses[key]) return res.json({ success: false });
    licenses[key].hwid = null;
    res.json({ success: true });
});

// List all keys
app.get('/api/admin/list-keys', auth, (req, res) => {
    res.json(licenses);
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
