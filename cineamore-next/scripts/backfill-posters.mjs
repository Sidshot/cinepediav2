/**
 * Backfill Posters Script
 * Fetches missing poster and backdrop images from TMDB for movies that don't have them
 * Run with: node scripts/backfill-posters.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    process.exit(1);
}

if (!TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEY not found');
    process.exit(1);
}

// Define schema
const MovieSchema = new mongoose.Schema({
    title: String,
    year: Number,
    poster: String,
    backdrop: String
}, { strict: false });

const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

async function searchTMDB(title, year) {
    const query = encodeURIComponent(title);
    const yearParam = year ? `&year=${year}` : '';
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}${yearParam}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    return data.results?.[0] || null;
}

async function backfillPosters() {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Find movies missing poster or backdrop
    const movies = await Movie.find({
        $or: [
            { poster: { $exists: false } },
            { poster: '' },
            { poster: null },
            { backdrop: { $exists: false } },
            { backdrop: '' },
            { backdrop: null }
        ]
    }).select('title year poster backdrop').lean();

    console.log(`📊 Found ${movies.length} movies missing images\n`);

    if (movies.length === 0) {
        console.log('✨ All movies have images!');
        await mongoose.disconnect();
        return;
    }

    let updated = 0;
    let failed = 0;

    for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        console.log(`[${i + 1}/${movies.length}] ${movie.title} (${movie.year || '?'})`);

        try {
            const tmdbResult = await searchTMDB(movie.title, movie.year);

            if (!tmdbResult) {
                console.log('  ❌ Not found on TMDB');
                failed++;
                continue;
            }

            const updates = {};

            if (!movie.poster && tmdbResult.poster_path) {
                updates.poster = `https://image.tmdb.org/t/p/w780${tmdbResult.poster_path}`;
            }

            if (!movie.backdrop && tmdbResult.backdrop_path) {
                updates.backdrop = `https://image.tmdb.org/t/p/w1280${tmdbResult.backdrop_path}`;
            }

            if (Object.keys(updates).length > 0) {
                await Movie.updateOne({ _id: movie._id }, { $set: updates });
                console.log(`  ✅ Updated: ${Object.keys(updates).join(', ')}`);
                updated++;
            } else {
                console.log('  ⏭️  No images available on TMDB');
            }

            // Rate limit: 1 request per 100ms
            await new Promise(r => setTimeout(r, 100));

        } catch (e) {
            console.log(`  ❌ Error: ${e.message}`);
            failed++;
        }
    }

    console.log(`\n📊 Results:`);
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ❌ Failed: ${failed}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
}

backfillPosters().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
