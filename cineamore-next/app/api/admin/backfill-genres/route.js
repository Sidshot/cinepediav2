import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { decrypt } from '@/lib/auth';
import { getMovieDetails, searchMovies } from '@/lib/tmdb';

export async function GET(req) {
    // 1. Auth Check
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // 2. Find Movies without Genres (Limit 5 per run for faster feedback)
    const movies = await Movie.find({
        $or: [{ genre: { $size: 0 } }, { genre: { $exists: false } }]
    }).limit(5);

    const results = [];
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Helper title cleaner
    const cleanTitle = (t) => t.replace(/\b(4k|1080p|720p|cam|ts|hdcam|hdts|bluray|x264|x265|hevc|web-dl|webrip)\b/gi, '').trim();

    for (const movie of movies) {
        try {
            await delay(250); // Rate limit protection

            // A. Search by Cleaned Title
            // Remove "4k", "1080p" etc from title to improve match rate
            const queryTitle = cleanTitle(movie.title);
            const searchRes = await searchMovies(queryTitle);

            let tmdbId = null;
            let newGenres = [];
            let status = 'Error';

            if (searchRes && searchRes.length > 0) {
                // Logic: Try to find exact year match, then +/- 1 year tolerance
                if (movie.year) {
                    const targetYear = parseInt(movie.year);
                    const exactMatch = searchRes.find(r => r.release_date && parseInt(r.release_date.split('-')[0]) === targetYear);

                    if (exactMatch) {
                        tmdbId = exactMatch.id;
                    } else {
                        const looseMatch = searchRes.find(r => {
                            if (!r.release_date) return false;
                            const y = parseInt(r.release_date.split('-')[0]);
                            return Math.abs(y - targetYear) <= 1;
                        });
                        tmdbId = looseMatch ? looseMatch.id : searchRes[0].id;
                    }
                } else {
                    tmdbId = searchRes[0].id;
                }

                // B. Get Details (with Genres)
                const details = await getMovieDetails(tmdbId);

                if (details && details.genre && details.genre.length > 0) {
                    newGenres = details.genre;
                    status = 'Updated';
                } else {
                    status = 'No Genres Found in TMDB';
                    newGenres = ['Uncategorized']; // Prevent infinite loop
                }
            } else {
                status = 'Title Search Failed (No Results)';
                newGenres = ['Uncategorized']; // Prevent infinite loop
            }

            // C. Update Movie (Success OR Failure)
            // We MUST save something (even 'Uncategorized') to remove it from the pending queue
            await Movie.collection.updateOne(
                { _id: movie._id },
                { $set: { genre: newGenres } }
            );

            results.push({
                title: movie.title,
                cleanedTitle: queryTitle,
                status: status,
                genre: newGenres
            });

        } catch (error) {
            console.error(`Error processing ${movie.title}:`, error);
            // Even on error, maybe we should skip it next time? For now, let it retry on error only.
            results.push({ title: movie.title, status: 'Error', error: error.message });
        }
    }

    const remaining = await Movie.countDocuments({
        $or: [{ genre: { $size: 0 } }, { genre: { $exists: false } }]
    });

    return NextResponse.json({
        processed: results.length,
        remaining,
        results
    });
}
