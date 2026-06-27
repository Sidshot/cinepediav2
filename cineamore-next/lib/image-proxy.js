
/**
 * Transforms a direct image URL into a proxied URL.
 * @param {string} url - The original image URL (e.g. from TMDB)
 * @returns {string} - The local proxy URL or the original if invalid.
 */
export function getProxyUrl(url) {
    if (!url || typeof url !== 'string') return '';
    if (url.startsWith('/')) return url; // Already local
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinepediav2.vercel.app';
    if (url.startsWith(siteUrl)) return url; // Already self

    // Only proxy http/https
    if (!url.startsWith('http')) return url;

    // Bypass proxy for known safe/CORS-friendly domains
    if (url.includes('tmdb.org') || url.includes('themoviedb.org') || url.includes('bing.net') || url.includes('googleusercontent.com')) {
        return url;
    }

    // Use built-in API route
    return `/api/image?url=${encodeURIComponent(url)}`;
}
