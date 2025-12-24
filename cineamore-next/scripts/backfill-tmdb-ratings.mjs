#!/usr/bin/env node
/**
 * Backfill TMDB Ratings for All Movies
 * 
 * Run: node scripts/backfill-tmdb-ratings.mjs
 * 
 * This script fetches TMDB ratings for all movies that don't have one yet (tmdbRating = 0).
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGO_URI = process.env.MONGODB_URI;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!MONGO_URI) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
}
if (!TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEY not set');
    process.exit(1);
}

// Movie Schema (minimal for this script)
const MovieSchema = new mongoose.Schema({
    title: String,
    year: Number,
    tmdbRating: { type: Number, default: 0 }
}, { strict: false });

const Movie = mongoose.model('Movie', MovieSchema);

async function getTMDBRating(title, year) {
    try {
        const yearParam = year ? `&year=${year}` : '';
        const res = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${yearParam}&include_adult=false`);
        if (!res.ok) return null;

        const data = await res.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].vote_average || 0;
        }
        return null;
    } catch (e) {
        console.error(`  Error fetching rating for "${title}":`, e.message);
        return null;
    }
}

async function main() {
    console.log('🎬 TMDB Ratings Backfill Script');
    console.log('================================\n');

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all movies without a rating (tmdbRating = 0 or missing)
    const movies = await Movie.find({
        $or: [
            { tmdbRating: { $exists: false } },
            { tmdbRating: 0 },
            { tmdbRating: null }
        ]
    }).select('title year tmdbRating').lean();

    console.log(`📊 Found ${movies.length} movies without ratings\n`);

    let updated = 0;
    let failed = 0;

    for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        process.stdout.write(`[${i + 1}/${movies.length}] "${movie.title}" (${movie.year || 'N/A'})... `);

        const rating = await getTMDBRating(movie.title, movie.year);

        if (rating !== null && rating > 0) {
            await Movie.updateOne({ _id: movie._id }, { $set: { tmdbRating: rating } });
            console.log(`✅ ${rating.toFixed(1)}`);
            updated++;
        } else {
            console.log(`⚠️ Not found`);
            failed++;
        }

        // Rate limit: 40 requests per 10 seconds (TMDB limit)
        if ((i + 1) % 35 === 0) {
            console.log('\n⏳ Rate limit pause (10s)...\n');
            await new Promise(r => setTimeout(r, 10000));
        }
    }

    console.log('\n================================');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⚠️ Not Found: ${failed}`);
    console.log('================================\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
}

main().catch(console.error);
