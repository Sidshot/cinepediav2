const config = require('./config');
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose'); // Database
const Movie = require('./models/Movie'); // Model

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = config.PORT;

// Trust Proxy (Required for Render/Heroku to see real IPs)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // relaxed for images/scripts
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for viral traffic
    message: 'Too many requests, please try again later.'
});
app.use(limiter);

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));

// Database Connection
const fs = require('fs');
const connectDB = async () => {
    if (!config.MONGO_URI) {
        console.log('⚠️ No MONGO_URI found. Server will start but DB calls will fail.');
        return;
    }
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // AUTO-SEED: Check if empty
        const count = await Movie.countDocuments();
        if (count === 0) {
            console.log('🌱 Database is empty. Attempting auto-seed...');
            const dataPath = path.join(__dirname, 'data', 'cinepedia.data.json');
            if (fs.existsSync(dataPath)) {
                const raw = fs.readFileSync(dataPath, 'utf8');
                const movies = JSON.parse(raw);

                // Normalize items to ensure IDs
                const validMovies = movies.map(m => {
                    const t = m.title || m.Title; // Handle casing if any
                    // Ensure ID
                    const fp = [t || '', m.year || '', m.director || ''].join('|').toLowerCase();
                    let h1 = 0xdeadbeef ^ fp.length, h2 = 0x41c6ce57 ^ fp.length;
                    for (let i = 0; i < fp.length; i++) {
                        const c = fp.charCodeAt(i);
                        h1 = Math.imul(h1 ^ c, 2654435761);
                        h2 = Math.imul(h2 ^ c, 1597334677);
                    }
                    h1 = (h1 ^ (h1 >>> 16)) >>> 0;
                    h2 = (h2 ^ (h2 >>> 13)) >>> 0;
                    const hash = (h2 * 4294967296 + h1).toString(36);

                    return {
                        ...m,
                        __id: m.__id || `fm_${hash}_Init`,
                        title: t
                    };
                }).filter(m => m.title); // Skip empty

                await Movie.insertMany(validMovies, { ordered: false });
                console.log(`✅ Auto-Seeded ${validMovies.length} movies.`);
            } else {
                console.log('ℹ️ cinepedia.data.json not found, skipping seed.');
            }
        }
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
    }
};
connectDB();

// Helper: ID Generator
function generateId(film) {
    const fp = [
        film.title || '', film.original || '', film.year || '', film.director || ''
    ].join('|').toLowerCase();

    let h1 = 0xdeadbeef ^ fp.length, h2 = 0x41c6ce57 ^ fp.length;
    for (let i = 0; i < fp.length; i++) {
        const c = fp.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 2654435761);
        h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = (h1 ^ (h1 >>> 16)) >>> 0;
    h2 = (h2 ^ (h2 >>> 13)) >>> 0;
    const hash = (h2 * 4294967296 + h1).toString(36);
    return `fm_${hash}_${Date.now().toString(36)}`;
}

// Middleware: Require Admin
const requireAdmin = (req, res, next) => {
    const pass = req.headers['x-admin-pass'] || req.body.password;
    if (pass === config.ADMIN_PASS) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Admin Access Required' });
    }
};

// API Routes
// POST /api/auth - Password Check
app.post('/api/auth', (req, res) => {
    const { password } = req.body;
    if (password === config.ADMIN_PASS) {
        return res.json({ success: true });
    }
    return res.json({ success: false });
});

// GET /api/movies - Read all
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find();
        res.json(movies);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

// POST /api/movies - Create new
app.post('/api/movies', requireAdmin, async (req, res) => {
    try {
        const newFilm = req.body;
        if (!newFilm.title) return res.status(400).json({ error: 'Title required' });

        newFilm.__id = generateId(newFilm);

        const created = await Movie.create(newFilm);
        res.json({ success: true, film: created });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create film' });
    }
});

// PUT /api/movies/:id - Update existing
app.put('/api/movies/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const update = req.body;

        const updated = await Movie.findOneAndUpdate({ __id: id }, update, { new: true });

        if (!updated) return res.status(404).json({ error: 'Not found' });

        res.json({ success: true, film: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update' });
    }
});

// POST /api/movies/:id/rate - Rate a film
app.post('/api/movies/:id/rate', async (req, res) => {
    try {
        const { id } = req.params;
        const { value } = req.body; // 0 (Egg) to 5

        if (typeof value !== 'number' || value < 0 || value > 5) {
            return res.status(400).json({ error: 'Invalid rating' });
        }

        // Atomic update
        const updated = await Movie.findOneAndUpdate(
            { __id: id },
            {
                $inc: { ratingSum: value, ratingCount: 1 }
            },
            { new: true }
        );

        if (!updated) return res.status(404).json({ error: 'Film not found' });

        res.json({
            success: true,
            ratingSum: updated.ratingSum,
            ratingCount: updated.ratingCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save rating' });
    }
});

// GET /api/requests - Export Requests as CSV
app.get('/api/requests', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', 'requests.json');
        if (!fs.existsSync(filePath)) {
            return res.send(''); // Empty CSV
        }

        const requests = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        // Convert to CSV with BOM for Excel and CRLF for Windows
        const header = '\uFEFFTitle;Year;Director;Letterboxd;Drive;Download\r\n';
        const rows = requests.map(r => `${r.title};;;;;;`).join('\r\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="requests.csv"');
        res.send(header + rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error exporting requests');
    }
});

// POST /api/import - Bulk Import & Fulfill
app.post('/api/import', requireAdmin, async (req, res) => {
    try {
        let imports = req.body;

        // Handle raw CSV string if sent
        if (req.body.csv) {
            const lines = req.body.csv.split('\n').filter(l => l.trim());
            imports = lines.map(line => {
                const cols = line.split(';');
                if (cols.length < 1) return null;
                return {
                    title: cols[0]?.trim(),
                    original: cols[1]?.trim(),
                    year: cols[2]?.trim(),
                    director: cols[3]?.trim(),
                    letterboxd: cols[4]?.trim(),
                    drive: cols[5]?.trim(),
                    download: cols[6]?.trim()
                };
            }).filter(Boolean);
        }

        if (!Array.isArray(imports)) return res.status(400).json({ error: 'Array required' });

        const results = {
            total: imports.length,
            success: 0,
            failed: 0,
            errors: []
        };

        const operations = [];
        const fulfilledTitles = [];

        // Validate and Prepare
        imports.forEach((f, idx) => {
            const rowNum = idx + 1;
            if (!f.title) {
                results.failed++;
                results.errors.push(`Row ${rowNum}: Missing 'title'`);
                return;
            }

            const doc = { ...f, __id: generateId(f) };
            operations.push({ insertOne: { document: doc } });
            fulfilledTitles.push(f.title.toLowerCase());
        });

        if (operations.length > 0) {
            try {
                const bulkRes = await Movie.bulkWrite(operations, { ordered: false });
                results.success = bulkRes.insertedCount;

                // FULFILLMENT LOGIC: Remove from requests.json
                const reqPath = path.join(__dirname, 'data', 'requests.json');
                if (fs.existsSync(reqPath)) {
                    let pending = JSON.parse(fs.readFileSync(reqPath, 'utf8'));
                    const originalCount = pending.length;
                    // Filter out requests that match imported titles
                    pending = pending.filter(p => !fulfilledTitles.includes(p.title.toLowerCase()));

                    if (pending.length < originalCount) {
                        fs.writeFileSync(reqPath, JSON.stringify(pending, null, 2));
                        console.log(`🧹 Creating fulfillment: Removed ${originalCount - pending.length} fulfilled requests.`);
                    }
                }

            } catch (bulkError) {
                if (bulkError.writeErrors) {
                    results.success = bulkError.result.insertedCount;
                    results.failed += bulkError.writeErrors.length;
                    bulkError.writeErrors.forEach(we => {
                        results.errors.push(`Row ? (Duplicate/Error): ${we.errmsg}`);
                    });
                }
            }
        }

        res.json(results);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Import failed: ' + err.message });
    }
});

// POST /api/request - User Request Film
app.post('/api/request', async (req, res) => {
    try {
        const { title } = req.body;
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const requestData = {
            title: title.trim(),
            date: new Date().toISOString(),
            ip: req.ip
        };

        const filePath = path.join(__dirname, 'data', 'requests.json');
        let currentRequests = [];

        // Read existing
        if (fs.existsSync(filePath)) {
            try {
                const raw = fs.readFileSync(filePath, 'utf8');
                currentRequests = JSON.parse(raw);
            } catch (e) {
                // Ignore corrupt file, start fresh
                currentRequests = [];
            }
        }

        currentRequests.push(requestData);

        // Save back
        fs.writeFileSync(filePath, JSON.stringify(currentRequests, null, 2));

        res.json({ success: true, message: 'Request saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save request' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
