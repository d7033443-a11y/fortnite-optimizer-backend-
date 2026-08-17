const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

// In-memory database (upgrade later)
let licenses = {
    "TEST-KEY-123": { active: true, hwid: null }
};

// Root route
app.get('/', (req, res) => {
    res.send('Optimizer backend online ✅');
});

// Validate license
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

// Generate new license key
app.post('/api/admin/generate-key', (req, res) => {
    const newKey = uuidv4().toUpperCase();
    licenses[newKey] = { active: true, hwid: null };
    res.json({ key: newKey });
});

// Disable a key
app.post('/api/admin/disable-key', (req, res) => {
    const { key } = req.body;
    if (!licenses[key]) return res.json({ success: false });
    licenses[key].active = false;
    res.json({ success: true });
});

// HWID reset
app.post('/api/admin/reset-hwid', (req, res) => {
    const { key } = req.body;
    if (!licenses[key]) return res.json({ success: false });
    licenses[key].hwid = null;
    res.json({ success: true });
});

// List all keys
app.get('/api/admin/list-keys', (req, res) => {
    res.json(licenses);
});

// Render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
