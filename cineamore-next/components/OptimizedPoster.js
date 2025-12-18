'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getProxyUrl } from '@/lib/image-proxy';

/**
 * Optimized movie poster image with fallback and error handling.
 * Uses Next.js Image component for automatic optimization and caching.
 */
export default function OptimizedPoster({
    src,
    title,
    year,
    width = 250,
    height = 375,
    className = '',
    priority = false
}) {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Reset state when src changes (e.g. user updates poster in Admin)
    useEffect(() => {
        setError(false);
        setLoaded(false);
    }, [src]);

    // Generate fallback URL using Bing search
    const fallbackUrl = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(`"${title}" (${year}) film poster`)}&w=300&h=450&c=7&rs=1&p=0`;

    // Use provided src, or fallback if empty/errored
    const imageUrl = (!src || error) ? fallbackUrl : getProxyUrl(src);

    return (
        <div className={`relative overflow-hidden bg-black/40 ${className}`}>
            {/* Loading skeleton */}
            {!loaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
            )}

            <Image
                src={imageUrl}
                alt={`${title} (${year}) poster`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
                className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
                onError={() => {
                    if (!error) {
                        setError(true);
                        setLoaded(true);
                    }
                }}
                priority={priority}
                unoptimized={imageUrl.includes('bing.net') || imageUrl.includes('/api/image')} // Bing URLs sometimes fail optimization
            />

            {/* Error state with title fallback */}
            {error && !imageUrl.includes('bing.net') && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--accent)]/20 to-transparent">
                    <span className="text-[var(--muted)] text-xs text-center px-2">{title}</span>
                </div>
            )}
        </div>
    );
}
