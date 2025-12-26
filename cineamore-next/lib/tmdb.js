'use server';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function searchMovies(query, year = null) {
    if (!API_KEY) return { error: 'TMDB_API_KEY missing' };
    if (!query) return [];

    try {
        const yearParam = year ? `&year=${year}` : '';
        const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}${yearParam}&include_adult=false`);
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
            genre: data.genres ? data.genres.map(g => g.name) : [],
            notes: '',
            posterUrl: posterUrl,
            backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
            lb: '',
        };
    } catch (e) {
        console.error('TMDB Details Error:', e);
        return { error: 'Details failed' };
    }
}

/**
 * Get TMDB Rating (vote_average) for a movie by title and year
 * Returns the rating (0-10) or null if not found
 */
export async function getTMDBRating(title, year = null) {
    if (!API_KEY) return null;
    if (!title) return null;

    try {
        const yearParam = year ? `&year=${year}` : '';
        const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}${yearParam}&include_adult=false`);
        if (!res.ok) return null;

        const data = await res.json();
        if (data.results && data.results.length > 0) {
            // Return the vote_average of the first (best) match
            return data.results[0].vote_average || 0;
        }
        return null;
    } catch (e) {
        console.error('TMDB Rating Error:', e);
        return null;
    }
}

// ============================================
// TV SERIES API FUNCTIONS
// ============================================

/**
 * Get trending TV series (weekly)
 */
export async function getTrendingSeries() {
    if (!API_KEY) return [];

    try {
        const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
    } catch (e) {
        // Silently fail - common in development when API key is not set
        return [];
    }
}

/**
 * Get popular TV series
 */
export async function getPopularSeries() {
    if (!API_KEY) return [];

    try {
        const res = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
    } catch (e) {
        // Silently fail - common in development when API key is not set
        return [];
    }
}

/**
 * Get top rated TV series
 */
export async function getTopRatedSeries() {
    if (!API_KEY) return [];

    try {
        const res = await fetch(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
    } catch (e) {
        // Silently fail - common in development when API key is not set
        return [];
    }
}

/**
 * Get TV series by genre
 */
export async function getSeriesByGenre(genreId, page = 1) {
    if (!API_KEY) return [];
    if (!genreId) return [];

    try {
        const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
    } catch (e) {
        // Silently fail - common in development when API key is not set
        return [];
    }
}

/**
 * Search TV series
 */
export async function searchSeries(query) {
    if (!API_KEY) return [];
    if (!query) return [];

    try {
        const res = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.results ? data.results.slice(0, 10) : [];
    } catch (e) {
        console.error('TMDB Series Search Error:', e);
        return [];
    }
}

/**
 * Get full series details including seasons
 */
export async function getSeriesDetails(tmdbId) {
    if (!API_KEY) return { error: 'TMDB_API_KEY missing' };

    try {
        const res = await fetch(`${BASE_URL}/tv/${tmdbId}?api_key=${API_KEY}&append_to_response=credits`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (!res.ok) throw new Error('Failed to fetch series details');
        const data = await res.json();

        // Extract creator (like director for movies)
        const creator = data.created_by?.[0]?.name || '';

        return {
            id: data.id,
            title: data.name,
            original: data.original_name !== data.name ? data.original_name : '',
            year: data.first_air_date ? data.first_air_date.split('-')[0] : '',
            endYear: data.last_air_date ? data.last_air_date.split('-')[0] : '',
            creator: creator,
            plot: data.overview || '',
            genre: data.genres ? data.genres.map(g => g.name) : [],
            posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : '',
            backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
            tmdbRating: data.vote_average || 0,
            seasons: data.seasons ? data.seasons.filter(s => s.season_number > 0).map(s => ({
                seasonNumber: s.season_number,
                name: s.name,
                episodeCount: s.episode_count,
                airDate: s.air_date,
                posterUrl: s.poster_path ? `https://image.tmdb.org/t/p/w300${s.poster_path}` : ''
            })) : [],
            numberOfSeasons: data.number_of_seasons || 0,
            numberOfEpisodes: data.number_of_episodes || 0,
            status: data.status || '',
            networks: data.networks ? data.networks.map(n => n.name) : []
        };
    } catch (e) {
        console.error('TMDB Series Details Error:', e);
        return { error: 'Series details failed' };
    }
}

/**
 * Get season details with episodes
 */
export async function getSeasonDetails(tmdbId, seasonNumber) {
    if (!API_KEY) return { error: 'TMDB_API_KEY missing' };

    try {
        const res = await fetch(`${BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${API_KEY}`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (!res.ok) throw new Error('Failed to fetch season details');
        const data = await res.json();

        return {
            seasonNumber: data.season_number,
            name: data.name,
            overview: data.overview,
            episodes: data.episodes ? data.episodes.map(ep => ({
                episodeNumber: ep.episode_number,
                name: ep.name,
                overview: ep.overview,
                airDate: ep.air_date,
                runtime: ep.runtime,
                stillUrl: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : ''
            })) : []
        };
    } catch (e) {
        console.error('TMDB Season Details Error:', e);
        return { error: 'Season details failed' };
    }
}
