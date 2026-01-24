import { unstable_cache } from 'next/cache';
import Movie from '@/models/Movie';
import dbConnect from '@/lib/mongodb';
import { getDailyTrending } from '@/lib/trending';

// Helper to serialize Mongoose docs with improved safety
const serializeMovie = (doc) => {
    if (!doc) return null;
    const d = { ...doc };
    if (d._id) d._id = d._id.toString?.() || String(d._id);
    if (d.__id) d.__id = String(d.__id); // Ensure legacy ID is string

    // Safe date serialization
    if (d.addedAt) {
        try {
            d.addedAt = typeof d.addedAt.toISOString === 'function'
                ? d.addedAt.toISOString()
                : new Date(d.addedAt).toISOString();
        } catch (e) {
            d.addedAt = null; // Fallback
        }
    }

    // Explicitly serialize downloadLinks
    if (d.downloadLinks && Array.isArray(d.downloadLinks)) {
        d.downloadLinks = d.downloadLinks.map(link => ({
            label: link.label || 'Download',
            url: link.url || '',
            _id: link._id ? (link._id.toString?.() || String(link._id)) : undefined,
            addedAt: link.addedAt ? (typeof link.addedAt.toISOString === 'function' ? link.addedAt.toISOString() : new Date(link.addedAt).toISOString()) : undefined
        }));
    }
    return d;
};

// 1. Cached Global Genres
export const getCachedGenres = unstable_cache(
    async () => {
        await dbConnect();
        const genreAgg = await Movie.aggregate([
            { $unwind: '$genre' },
            { $group: { _id: '$genre' } },
            { $sort: { _id: 1 } }
        ]);
        return genreAgg.map(g => g._id).filter(g => g && g !== 'Uncategorized');
    },
    ['home-genres'],
    { revalidate: 86400 } // QUOTA FIX: Cache for 24 hours (match page ISR)
);

// 2. Cached Hero Movies
export const getCachedHeroMovies = unstable_cache(
    async () => {
        await dbConnect();
        const heroSample = await Movie.aggregate([
            { $match: { 'visibility.state': 'visible', backdrop: { $exists: true, $ne: null, $ne: '' } } },
            { $sample: { size: 10 } },
            { $project: { title: 1, year: 1, director: 1, backdrop: 1, poster: 1, __id: 1 } }
        ]);
        return heroSample.map(doc => ({ ...doc, _id: doc._id.toString() }));
    },
    ['home-hero'],
    { revalidate: 86400 } // QUOTA FIX: Cache for 24 hours
);

// 3. Cached Recently Added
export const getCachedRecentlyAdded = unstable_cache(
    async () => {
        await dbConnect();
        const recentMoviesDocs = await Movie.find({ 'visibility.state': 'visible' })
            .sort({ addedAt: -1 })
            .select('title year director poster __id addedAt downloadLinks tmdbRating')
            .slice('downloadLinks', 1)
            .limit(18)
            .lean();
        return recentMoviesDocs.map(serializeMovie);
    },
    ['home-recent'],
    { revalidate: 86400 } // QUOTA FIX: Cache for 24 hours
);

// 4. Cached Trending (Wrapper around getDailyTrending)
export const getCachedTrending = unstable_cache(
    async () => {
        const rawTrending = await getDailyTrending();
        return rawTrending.map(serializeMovie);
    },
    ['home-trending'],
    { revalidate: 86400 } // QUOTA FIX: Cache for 24 hours
);

// 5. Cached Genre Rows
export const getCachedGenreRows = unstable_cache(
    async (genres) => {
        await dbConnect();
        const genrePromises = genres.map(async (genre) => {
            const movies = await Movie.find({ genre: genre, 'visibility.state': 'visible' })
                .sort({ year: -1, addedAt: -1 })
                .select('title year director poster __id addedAt downloadLinks genre tmdbRating')
                .slice('downloadLinks', 1)
                .limit(18)
                .lean();

            return {
                title: genre,
                movies: movies.map(serializeMovie)
            };
        });

        const rows = await Promise.all(genrePromises);
        return rows.filter(row => row.movies.length > 0);
    },
    ['home-genre-rows'],
    { revalidate: 86400 } // QUOTA FIX: Cache for 24 hours
);
