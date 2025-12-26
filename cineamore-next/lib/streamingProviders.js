export const STREAMING_PROVIDERS = [
    {
        id: 'alpha',
        name: 'Alpha',
        baseUrl: 'https://www.vidking.net/embed/movie',
        type: 'vidking',
        urlType: 'path' // Uses /{tmdbId}
    },
    {
        id: 'beta',
        name: 'Beta',
        baseUrl: 'https://2embed.cc/embed',
        type: 'embed',
        urlType: 'path' // Uses /{tmdbId}
    },
    {
        id: 'gamma',
        name: 'Gamma',
        baseUrl: 'https://hnembed.cc/embed/movie',
        type: 'embed',
        urlType: 'query', // Uses ?tmdb={tmdbId}
        queryParam: 'tmdb'
    },
    {
        id: 'delta',
        name: 'Delta',
        baseUrl: 'https://www.superembed.stream/embed/movie',
        type: 'embed',
        urlType: 'query',
        queryParam: 'tmdb'
    },
    {
        id: 'epsilon',
        name: 'Epsilon',
        baseUrl: 'https://moviesapi.club/movie',
        type: 'embed',
        urlType: 'path'
    },
    {
        id: 'zeta',
        name: 'Zeta',
        baseUrl: 'https://vidsrc.me/embed/movie',
        type: 'embed',
        urlType: 'query',
        queryParam: 'tmdb'
    },
    {
        id: 'eta',
        name: 'Eta',
        baseUrl: 'https://vidsrc.xyz/embed/movie',
        type: 'embed',
        urlType: 'path'
    },
    {
        id: 'theta',
        name: 'Theta',
        baseUrl: 'https://embed.su/embed/movie',
        type: 'embed',
        urlType: 'path'
    },
    {
        id: 'iota',
        name: 'Iota',
        baseUrl: 'https://player.smashy.stream/movie',
        type: 'embed',
        urlType: 'path'
    },
    {
        id: 'kappa',
        name: 'Kappa',
        baseUrl: 'https://player.autoembed.cc/embed/movie',
        type: 'embed',
        urlType: 'path'
    }
];

export function getProviderById(id) {
    return STREAMING_PROVIDERS.find(p => p.id === id) || STREAMING_PROVIDERS[0];
}

export function constructEmbedUrl(providerId, tmdbId) {
    const provider = getProviderById(providerId);

    let url = provider.baseUrl;

    // Handle path structure (remove trailing slash if present)
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }

    // Construct URL based on provider's URL type
    if (provider.urlType === 'query') {
        // Query param style: ?tmdb=123 or ?id=123
        const param = provider.queryParam || 'tmdb';
        url += `?${param}=${tmdbId}`;
    } else {
        // Path style: /123
        url += `/${tmdbId}`;
    }

    // Special handling for VidKing params
    if (provider.type === 'vidking') {
        url += '&color=fbbf24&autoPlay=true';
    }

    return url;
}

export function constructTVEmbedUrl(providerId, tmdbId, season, episode) {
    // Validate inputs
    if (!tmdbId || !season || !episode) {
        console.warn('constructTVEmbedUrl: Invalid params', { providerId, tmdbId, season, episode });
        return '';
    }

    const provider = getProviderById(providerId);

    // VidKing uses special path structure for TV
    if (provider.type === 'vidking') {
        return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=ea580c&autoPlay=true&nextEpisode=true&episodeSelector=true`;
    }

    // Other providers - convert baseUrl from /movie to /tv
    let url = provider.baseUrl;

    // Smart replacement: if baseUrl contains /movie, replace it, otherwise add /tv intelligently
    if (url.includes('/movie')) {
        url = url.replace('/movie', '/tv');
    } else if (url.includes('/embed') && !url.includes('/tv')) {
        // For providers like Beta (2embed.cc/embed), insert /tv after /embed
        url = url.replace('/embed', '/embed/tv');
    }

    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }

    // Construct URL based on provider's URL type
    if (provider.urlType === 'query') {
        const param = provider.queryParam || 'tmdb';
        url += `?${param}=${tmdbId}&s=${season}&e=${episode}`;
    } else {
        // Path style varies - some use /tv/{id}, some /tv/{id}/{season}/{episode}
        // Testing shows most use just /tv/{id}
        url += `/${tmdbId}`;
    }

    return url;
}
