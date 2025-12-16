const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Polyfill for ObjectID generation (roughly)
function generateId() {
    return crypto.randomBytes(12).toString('hex');
}

const SOURCE_PATH = path.join(__dirname, '../data/cinepedia.data.json');
const DEST_PATH = path.join(__dirname, '../cineamore-next/lib/movies.json');

try {
    console.log('📦 Reading source data...');
    const rawData = fs.readFileSync(SOURCE_PATH, 'utf8');
    const movies = JSON.parse(rawData);

    console.log(`✨ Processing ${movies.length} movies...`);

    const processed = movies.map((movie, index) => {
        return {
            _id: generateId(),
            __id: generateId(), // Legacy ID support
            title: movie.title,
            year: movie.year || 'N/A',
            director: movie.director || 'Unknown',
            plot: movie.plot || 'No plot summary available.',
            notes: movie.notes || '',
            imdb: movie.imdb || '', // Can be ID or full link
            letterboxd: movie.letterboxd || movie.lb || '', // Can be slug or full link
            rating: movie.rating || 0,
            ratingSum: 0,
            ratingCount: 0,
            genres: movie.genres || [],
            duration: movie.duration || '',
            addedAt: new Date().toISOString(),
            // Keep original links for detail view if needed (though page.js only needs basic info)
            drive: movie.drive,
            dl: movie.dl
        };
    });

    // Sort by newest (simulated by array order or just keep as is)
    // We'll just keep array order.

    fs.writeFileSync(DEST_PATH, JSON.stringify(processed, null, 2));
    console.log(`✅ Bundle created at: ${DEST_PATH}`);
    console.log('Ready for Vercel Static Deployment.');

} catch (err) {
    console.error('❌ Bundle failed:', err);
    process.exit(1);
}
