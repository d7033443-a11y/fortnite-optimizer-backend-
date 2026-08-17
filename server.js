const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Simple in-memory license store
// Replace or expand this later with a database
let licenses = {
    "TEST-KEY-123": { active: true, hwid: null }
};

// Root route (so Render shows a page instead of "Not Found")
app.get('/', (req, res) => {
    res.send('Optimizer backend online ✅');
});

// License validation endpoint
app.post('/api/license/validate', (req, res) => {
    const { key, hwid } = req.body;

    // Key doesn't exist or is inactive
    if (!licenses[key] || !licenses[key].active) {
        return res.json({ valid: false });
    }

    // First-time HWID binding
    if (!licenses[key].hwid) {
        licenses[key].hwid = hwid;
        return res.json({ valid: true });
    }

    // HWID mismatch
    if (licenses[key].hwid !== hwid) {
        return res.json({ valid: false });
    }

    // Valid key + matching HWID
    res.json({ valid: true });
});

// Render requires using process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});

