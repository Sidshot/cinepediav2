require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose'); // Database
const Movie = require('./models/Movie'); // Model

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));

// Database Connection
const fs = require('fs');
const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.log('⚠️ No MONGO_URI found. Server will start but DB calls will fail.');
        return;
    }
    try {
        await mongoose.connect(process.env.MONGO_URI);
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

// API Routes
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'; // Default fallback

// POST /api/auth - Password Check
app.post('/api/auth', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
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
app.post('/api/movies', async (req, res) => {
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
app.put('/api/movies/:id', async (req, res) => {
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

// POST /api/import - Bulk Import
app.post('/api/import', async (req, res) => {
    try {
        let imports = req.body;

        // Handle raw CSV string if sent
        if (req.body.csv) {
            const lines = req.body.csv.split('\n').filter(l => l.trim());
            // Assume simple CSV: Title;Original;Year;Director;Letterboxd;Drive;Download
            // Skipping header check for simplicity or assume no header? user pasted "content".
            // Let's assume the user pastes WITH header if they copied from Excel? Or without?
            // Safest to just map based on position.
            // But wait, the previous code expected an object.
            // Let's implement a quick parser
            imports = lines.map(line => {
                const cols = line.split(';'); // Semicolon separated based on previous prompt hints
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

        // Validate and Prepare
        imports.forEach((f, idx) => {
            // Row number (Visual 1-based)
            const rowNum = idx + 1;

            if (!f.title) {
                results.failed++;
                results.errors.push(`Row ${rowNum}: Missing 'title'`);
                return;
            }

            // Create Operation
            const doc = { ...f, __id: generateId(f) };

            // Push to operations for bulkWrite (more robust than insertMany with errors)
            operations.push({
                insertOne: { document: doc }
            });
        });

        if (operations.length > 0) {
            try {
                // ordered: false ensures one failure doesn't stop the rest
                const bulkRes = await Movie.bulkWrite(operations, { ordered: false });
                results.success = bulkRes.insertedCount;
            } catch (bulkError) {
                // If there are write errors (e.g. duplicates if we had unique index, though we don't yet)
                if (bulkError.writeErrors) {
                    results.success = bulkError.result.insertedCount; // Partial success
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

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
