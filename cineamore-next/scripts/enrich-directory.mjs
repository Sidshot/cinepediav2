#!/usr/bin/env node
/**
 * TMDB Enrichment Script for Directory Movies
 * Fetches metadata from TMDB for movies imported from the directory
 * 
 * Adds: poster, backdrop, plot, director, genres, Letterboxd link
 * 
 * Run with: node scripts/enrich-directory.mjs
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
 * Search TMDB for Movies
 */

/**
 * Search TMDB for Movies
 */
async function searchTMDB_Movie(title, year) {
    // Aggressive cleaning for better match
    let cleanTitle = title;

    // Remove content inside brackets/parentheses
    cleanTitle = cleanTitle.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');

    // Replace separators with spaces
    cleanTitle = cleanTitle.replace(/[._-]/g, ' ');

    // Remove special characters (keep alphanumeric & spaces)
    // cleanTitle = cleanTitle.replace(/[^a-zA-Z0-9\s]/g, ''); // Too aggressive for foreign titles?
    // Let's stick to removing common junk

    cleanTitle = cleanTitle.trim();

    // If strict clean is empty, revert to original
    if (!cleanTitle) cleanTitle = title;

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

async function enrichDirectoryMovies() {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Find movies that look like they came from directory scraping (Uncategorized)
    // OR just missing data generally
    const movies = await Movie.find({
        $or: [
            { genre: 'Uncategorized' },
            { genre: { $size: 0 } },
            { plot: { $exists: false } },
            { plot: '' }
        ]
    }).select('__id title year director plot genre lb poster backdrop').lean();

    console.log(`📊 Found ${movies.length} movies needing enrichment\n`);

    if (movies.length === 0) {
        console.log('✨ All movies are enriched!');
        await mongoose.disconnect();
        return;
    }


    // ... (previous code)

    let enriched = 0;
    let notFound = 0;
    let errors = 0;

    // CONCURRENCY CONTROL
    const CONCURRENCY = 5;

    // Helper for fetch with timeout
    const fetchWithTimeout = async (url, options = {}) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000); // 5s timeout
        try {
            const res = await fetch(url, {
                ...options,
                headers: {
                    'User-Agent': 'CineAmore/1.0',
                    ...options.headers
                },
                signal: controller.signal
            });
            clearTimeout(id);
            return res;
        } catch (e) {
            clearTimeout(id);
            throw e;
        }
    };

    // Override the search function to use timeout
    async function searchTMDB_Movie_Optimized(title, year) {
        let cleanTitle = title.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').replace(/[._-]/g, ' ').trim();
        if (!cleanTitle) cleanTitle = title;

        const query = encodeURIComponent(cleanTitle);
        const yearParam = year ? `&year=${year}` : '';
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}${yearParam}&include_adult=false`;

        try {
            const res = await fetchWithTimeout(url);
            if (!res.ok) return null;
            const data = await res.json();
            return data.results?.[0] || null;
        } catch (e) {
            return null;
        }
    }

    async function getMovieDetails_Optimized(tmdbId) {
        const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
        try {
            const res = await fetchWithTimeout(url);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    // Process a single movie
    async function processMovie(movie) {
        try {
            // Check if quarantined (hidden) - if so, we are trying to fix it
            // Log less to avoid spam

            let searchResult = await searchTMDB_Movie_Optimized(movie.title, movie.year);
            let details = null;

            if (searchResult) {
                details = await getMovieDetails_Optimized(searchResult.id);
            }

            if (!details) {
                // Only log failure if it wasn't already hidden
                // console.log(`❌ ${movie.title}: Not found`);
                if (!movie.hidden) {
                    await Movie.updateOne({ __id: movie.__id }, { $set: { hidden: true } });
                }
                return { status: 'not_found' };
            }

            // Extract data
            const updates = {};
            if (!movie.poster && (details.poster_path || searchResult.poster_path)) {
                updates.poster = `https://image.tmdb.org/t/p/w780${details.poster_path || searchResult.poster_path}`;
            }
            if (!movie.backdrop && (details.backdrop_path || searchResult.backdrop_path)) {
                updates.backdrop = `https://image.tmdb.org/t/p/w1280${details.backdrop_path || searchResult.backdrop_path}`;
            }
            if (!movie.plot && (details.overview || searchResult.overview)) updates.plot = details.overview || searchResult.overview;

            if (!movie.director || movie.director === 'Unknown') {
                const director = details.credits?.crew?.find(p => p.job === 'Director');
                if (director) updates.director = director.name;
            }

            if (details.genres?.length > 0) {
                const tmdbGenres = details.genres.map(g => g.name);
                const existing = (movie.genre || []).filter(g => g !== 'Uncategorized');
                updates.genre = [...new Set([...existing, ...tmdbGenres])];
            }

            if (!movie.lb) {
                const y = details.release_date?.split('-')[0] || movie.year;
                updates.lb = generateLetterboxdUrl(movie.title, y);
            }

            if (!movie.year) {
                const y = parseInt(details.release_date?.split('-')[0]);
                if (y) updates.year = y;
            }

            if (Object.keys(updates).length > 0) {
                updates.hidden = false; // Un-hide!
                await Movie.updateOne({ __id: movie.__id }, { $set: updates });
                console.log(`✅ ${movie.title}: Fixed`);
                return { status: 'enriched' };
            }

            return { status: 'skipped' };

        } catch (e) {
            return { status: 'error' };
        }
    }

    // MAIN LOOP WITH BATCHING + CONCURRENCY
    console.log(`Starting processing with concurrency ${CONCURRENCY}...`);

    for (let i = 0; i < movies.length; i += CONCURRENCY) {
        const chunk = movies.slice(i, i + CONCURRENCY);
        const promises = chunk.map(m => processMovie(m));

        const results = await Promise.all(promises);

        results.forEach(r => {
            if (r.status === 'enriched') enriched++;
            if (r.status === 'not_found') notFound++;
            if (r.status === 'error') errors++;
        });

        if (i % 20 === 0) {
            const percent = Math.round((i / movies.length) * 100);
            process.stdout.write(`\rProgress: ${percent}% | Enriched: ${enriched} | Bad: ${notFound} | Err: ${errors}   `);
        }
    }

    console.log('\n\nDone.');
    await mongoose.disconnect();
}

enrichDirectoryMovies().catch(console.error);

