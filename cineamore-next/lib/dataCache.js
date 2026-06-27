'use client';

/**
 * CineAmore Data Cache
 * 
 * SECURITY NOTES:
 * - Only caches PUBLIC content data (movies, series, anime listings)
 * - NO user data, auth tokens, or sensitive info is ever cached
 * - localStorage is origin-scoped (only the active CineAmore origin can access)
 * - Data is validated on read to prevent tampering
 * - TTL prevents stale data exploitation
 */

const CACHE_PREFIX = 'ca_cache_';
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Safely get cached data
 * @param {string} key - Cache key (e.g., 'series_trending')
 * @returns {any|null} - Cached data or null if expired/invalid
 */
export function getCache(key) {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;

        const { data, expiry, version } = JSON.parse(raw);

        // Check expiry
        if (Date.now() > expiry) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        // Validate data structure (basic integrity check)
        if (!data || typeof data !== 'object') {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return data;
    } catch (e) {
        // Corrupted data - remove it
        try { localStorage.removeItem(CACHE_PREFIX + key); } catch { }
        return null;
    }
}

/**
 * Safely set cached data
 * @param {string} key - Cache key
 * @param {any} data - Data to cache (must be serializable)
 * @param {number} ttl - Time to live in ms (default 30 min)
 */
export function setCache(key, data, ttl = DEFAULT_TTL) {
    if (typeof window === 'undefined') return;

    try {
        const cacheEntry = {
            data,
            expiry: Date.now() + ttl,
            version: 1 // For future cache invalidation
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheEntry));
    } catch (e) {
        // Storage full or other error - fail silently
        console.warn('[Cache] Failed to cache:', key);
    }
}

/**
 * Clear all CineAmore cache
 */
export function clearAllCache() {
    if (typeof window === 'undefined') return;

    try {
        Object.keys(localStorage)
            .filter(k => k.startsWith(CACHE_PREFIX))
            .forEach(k => localStorage.removeItem(k));
    } catch { }
}

/**
 * Cleanup expired entries (call periodically)
 */
export function cleanupExpiredCache() {
    if (typeof window === 'undefined') return;

    try {
        Object.keys(localStorage)
            .filter(k => k.startsWith(CACHE_PREFIX))
            .forEach(k => {
                try {
                    const { expiry } = JSON.parse(localStorage.getItem(k) || '{}');
                    if (expiry && Date.now() > expiry) {
                        localStorage.removeItem(k);
                    }
                } catch {
                    localStorage.removeItem(k);
                }
            });
    } catch { }
}

// Cache keys for content
export const CACHE_KEYS = {
    SERIES_TRENDING: 'series_trending',
    SERIES_POPULAR: 'series_popular',
    SERIES_TOP_RATED: 'series_toprated',
    SERIES_GENRES: 'series_genres',
    ANIME_TRENDING: 'anime_trending',
    ANIME_POPULAR: 'anime_popular',
    ANIME_TOP_RATED: 'anime_toprated',
    ANIME_GENRES: 'anime_genres',
    FILMS_HERO: 'films_hero',
    FILMS_TRENDING: 'films_trending',
    FILMS_RECENT: 'films_recent',
};
