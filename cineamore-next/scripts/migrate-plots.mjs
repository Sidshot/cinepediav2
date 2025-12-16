/**
 * Migration Script: Fetch Missing Plot Summaries from TMDB
 * 
 * This script finds movies without a `plot` field and fetches the overview from TMDB.
 * Includes rate limiting to avoid API throttling.
 * 
 * Run with: node scripts/migrate-plots.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
}

if (!TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEY not found in environment');
    process.exit(1);
}

// Define schema
const MovieSchema = new mongoose.Schema({
    __id: String,
    title: String,
    year: Number,
    plot: String
}, { strict: false });

const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

// TMDB API helper
async function searchTMDB(title, year) {
    const query = encodeURIComponent(title);
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}${year ? `&year=${year}` : ''}&language=en-US`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Return the first result's overview
            return data.results[0].overview || null;
        }
        return null;
    } catch (error) {
        console.error(`   ⚠️ API Error for "${title}":`, error.message);
        return null;
    }
}

// Rate limit helper (40 requests per 10 seconds = 4 per second)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrate() {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Find movies without plot field
    const moviesWithoutPlot = await Movie.find({
        $or: [
            { plot: { $exists: false } },
            { plot: null },
            { plot: '' }
        ]
    }).select('title year _id').lean();

    console.log(`📊 Found ${moviesWithoutPlot.length} movies without plot summaries\n`);

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Process in batches to respect rate limits
    const BATCH_SIZE = 35; // TMDB allows 40 requests per 10 seconds
    const BATCH_DELAY = 11000; // 11 seconds between batches

    for (let i = 0; i < moviesWithoutPlot.length; i++) {
        const movie = moviesWithoutPlot[i];

        // Rate limiting: pause every BATCH_SIZE requests
        if (i > 0 && i % BATCH_SIZE === 0) {
            console.log(`\n⏳ Rate limit pause (${i}/${moviesWithoutPlot.length})...\n`);
            await sleep(BATCH_DELAY);
        }

        const plot = await searchTMDB(movie.title, movie.year);

        if (plot && plot.length > 10) {
            await Movie.updateOne(
                { _id: movie._id },
                { $set: { plot: plot } }
            );
            console.log(`✅ ${movie.title} (${movie.year || 'N/A'})`);
            successCount++;
        } else {
            console.log(`❌ ${movie.title} (${movie.year || 'N/A'}) - No plot found`);
            failedCount++;
        }

        // Small delay between individual requests
        await sleep(100);
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Updated: ${successCount}`);
    console.log(`   ❌ No plot found: ${failedCount}`);
    console.log(`   📦 Total processed: ${moviesWithoutPlot.length}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
