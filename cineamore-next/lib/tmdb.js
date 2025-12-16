'use server';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function searchMovies(query) {
    if (!API_KEY) return { error: 'TMDB_API_KEY missing' };
    if (!query) return [];

    try {
        const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);
        if (!res.ok) throw new Error('Failed to fetch from TMDB');
        const data = await res.json();
        return data.results ? data.results.slice(0, 5) : []; // Return top 5
    } catch (e) {
        console.error('TMDB Search Error:', e);
        return { error: 'Search failed' };
    }
}

export async function getMovieDetails(tmdbId) {
    if (!API_KEY) return { error: 'TMDB_API_KEY missing' };

    try {
        // Fetch Details + Credits (for Director)
        const res = await fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${API_KEY}&append_to_response=credits`);
        if (!res.ok) throw new Error('Failed to fetch details');
        const data = await res.json();

        // Extract Director
        const director = data.credits?.crew?.find(p => p.job === 'Director')?.name || '';

        // Extract Poster (Full URL)
        const posterUrl = data.poster_path
            ? `https://image.tmdb.org/t/p/w780${data.poster_path}`
            : '';

        // Extract Letterboxd URL (Fallback, usually LB uses TMDB ID, but we just want metadata)
        // We will return data in a structure that our Form expects
        return {
            title: data.title,
            original: data.original_title !== data.title ? data.original_title : '',
            year: data.release_date ? data.release_date.split('-')[0] : '',
            director: director,
            plot: data.overview || '',
            notes: '', // Notes are for editor, not auto-filled usually
            posterUrl: posterUrl,
            lb: '', // We don't get LB url from TMDB directly
        };
    } catch (e) {
        console.error('TMDB Details Error:', e);
        return { error: 'Details failed' };
    }
}
