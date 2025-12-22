#!/usr/bin/env node
/**
 * TMDB Enrichment Script for Korean Dramas
 * Fetches metadata from TMDB for Korean dramas that lack enrichment data
 * 
 * Adds: poster, backdrop, plot, director, genres, Letterboxd link
 * 
 * Run with: node scripts/enrich-korean-dramas.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

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

// Define schema with all fields we want to enrich
const MovieSchema = new mongoose.Schema({
    __id: String,
    title: String,
    original: String,
    year: Number,
    director: String,
    plot: String,
    genre: [String],
    lb: String,
    poster: String,
    backdrop: String,
    downloadLinks: [{ label: String, url: String, addedAt: Date }],
    addedAt: Date
}, { strict: false });

const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

/**
 * Search TMDB for TV shows (Korean dramas are TV series)
 */
async function searchTMDB_TV(title) {
    // Clean title for better search
    const cleanTitle = title
        .replace(/\s+S\d+$/i, '')  // Remove season suffix
        .replace(/\s+Season\s+\d+$/i, '')
        .replace(/\s+\(Director's Cut\)/i, '')
        .replace(/\s+\([^)]+\)$/i, '')  // Remove year/edition suffixes
        .trim();

    const query = encodeURIComponent(cleanTitle);
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${query}&include_adult=false`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();

        // Prefer Korean results
        const koreanResult = data.results?.find(r => r.origin_country?.includes('KR'));
        return koreanResult || data.results?.[0] || null;
    } catch (e) {
        return null;
    }
}

/**
 * Also try movie search as fallback (some K-dramas might be movies)
 */
async function searchTMDB_Movie(title, year) {
    const cleanTitle = title
        .replace(/\s+\([^)]+\)$/i, '')
        .trim();

    const query = encodeURIComponent(cleanTitle);
    const yearParam = year ? `&year=${year}` : '';
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}${yearParam}&include_adult=false`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.results?.[0] || null;
    } catch (e) {
        return null;
    }
}

/**
 * Get TV show details including credits
 */
async function getTVDetails(tmdbId) {
    const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

/**
 * Get movie details including credits
 */
async function getMovieDetails(tmdbId) {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

/**
 * Generate Letterboxd-style slug from title
 */
function generateLetterboxdUrl(title, year) {
    const slug = title
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return year
        ? `https://letterboxd.com/film/${slug}-${year}/`
        : `https://letterboxd.com/film/${slug}/`;
}

async function enrichKoreanDramas() {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Find Korean dramas that need enrichment (have Korean genre but missing plot/poster)
    const dramas = await Movie.find({
        genre: { $in: ['Korean', 'Drama'] },
        $or: [
            { plot: { $exists: false } },
            { plot: '' },
            { plot: null },
            { poster: { $exists: false } },
            { poster: '' },
            { poster: null }
        ]
    }).select('__id title year director plot genre lb poster backdrop').lean();

    console.log(`📊 Found ${dramas.length} Korean dramas needing enrichment\n`);

    if (dramas.length === 0) {
        console.log('✨ All Korean dramas are enriched!');
        await mongoose.disconnect();
        return;
    }

    let enriched = 0;
    let notFound = 0;
    let errors = 0;

    const batchSize = 20;
    const totalBatches = Math.ceil(dramas.length / batchSize);

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const start = batchNum * batchSize;
        const end = Math.min(start + batchSize, dramas.length);
        const batch = dramas.slice(start, end);

        console.log(`\n📥 Batch ${batchNum + 1}/${totalBatches} (items ${start + 1}-${end})`);

        for (const drama of batch) {
            process.stdout.write(`  ${drama.title}... `);

            try {
                // Try TV search first (most K-dramas are TV series)
                let searchResult = await searchTMDB_TV(drama.title);
                let details = null;
                let isTV = true;

                if (searchResult) {
                    details = await getTVDetails(searchResult.id);
                }

                // Fallback to movie search
                if (!details) {
                    searchResult = await searchTMDB_Movie(drama.title, drama.year);
                    if (searchResult) {
                        details = await getMovieDetails(searchResult.id);
                        isTV = false;
                    }
                }

                if (!details) {
                    console.log('❌ Not found');
                    notFound++;
                    continue;
                }

                // Extract data based on type (TV or Movie)
                const updates = {};

                // Poster
                if (!drama.poster && (details.poster_path || searchResult.poster_path)) {
                    updates.poster = `https://image.tmdb.org/t/p/w780${details.poster_path || searchResult.poster_path}`;
                }

                // Backdrop
                if (!drama.backdrop && (details.backdrop_path || searchResult.backdrop_path)) {
                    updates.backdrop = `https://image.tmdb.org/t/p/w1280${details.backdrop_path || searchResult.backdrop_path}`;
                }

                // Plot
                if (!drama.plot && (details.overview || searchResult.overview)) {
                    updates.plot = details.overview || searchResult.overview;
                }

                // Director/Creator
                if (!drama.director || drama.director === 'Unknown') {
                    if (isTV && details.created_by?.length > 0) {
                        updates.director = details.created_by[0].name;
                    } else if (!isTV && details.credits?.crew) {
                        const director = details.credits.crew.find(p => p.job === 'Director');
                        if (director) updates.director = director.name;
                    }
                }

                // Genres (merge with existing)
                if (details.genres?.length > 0) {
                    const tmdbGenres = details.genres.map(g => g.name);
                    const existingGenres = drama.genre || [];
                    const mergedGenres = [...new Set([...existingGenres, ...tmdbGenres])];
                    if (mergedGenres.length > existingGenres.length) {
                        updates.genre = mergedGenres;
                    }
                }

                // Letterboxd URL (generate if missing)
                if (!drama.lb) {
                    const year = isTV
                        ? (details.first_air_date?.split('-')[0])
                        : (details.release_date?.split('-')[0]);
                    updates.lb = generateLetterboxdUrl(drama.title, year || drama.year);
                }

                // Year (if missing)
                if (!drama.year) {
                    const year = isTV
                        ? parseInt(details.first_air_date?.split('-')[0])
                        : parseInt(details.release_date?.split('-')[0]);
                    if (year && !isNaN(year)) updates.year = year;
                }

                if (Object.keys(updates).length > 0) {
                    await Movie.updateOne({ __id: drama.__id }, { $set: updates });
                    console.log(`✅ (${Object.keys(updates).join(', ')})`);
                    enriched++;
                } else {
                    console.log('⏭️ Already complete');
                }

                // Rate limit: 150ms between requests to be safe
                await new Promise(r => setTimeout(r, 150));

            } catch (e) {
                console.log(`❌ Error: ${e.message}`);
                errors++;
            }
        }

        const progress = Math.round(((batchNum + 1) / totalBatches) * 100);
        console.log(`\n📊 Progress: ${progress}% | Enriched: ${enriched} | Not Found: ${notFound} | Errors: ${errors}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎬 ENRICHMENT COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Enriched: ${enriched}`);
    console.log(`🔍 Not Found on TMDB: ${notFound}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
}

enrichKoreanDramas().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
