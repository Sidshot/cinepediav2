
/**
 * Transforms a direct image URL into a proxied URL.
 * @param {string} url - The original image URL (e.g. from TMDB)
 * @returns {string} - The local proxy URL or the original if invalid.
 */
export function getProxyUrl(url) {
    if (!url || typeof url !== 'string') return '';
    if (url.startsWith('/')) return url; // Already local
    if (url.includes('cineamore.vercel.app')) return url; // Already self

    // Only proxy http/https
    if (!url.startsWith('http')) return url;

    // Use built-in API route
    return `/api/image?url=${encodeURIComponent(url)}`;
}
