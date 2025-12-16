'use client';

import Image from 'next/image';
import { useState } from 'react';

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

    // Generate fallback URL using Bing search
    const fallbackUrl = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(`"${title}" (${year}) film poster`)}&w=300&h=450&c=7&rs=1&p=0`;

    // Use provided src, or fallback if empty/errored
    const imageUrl = (!src || error) ? fallbackUrl : src;

    return (
        <div className={`relative overflow-hidden bg-black/40 ${className}`}>
            {/* Loading skeleton */}
            {!loaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
            )}

            <Image
                src={imageUrl}
                alt={`${title} (${year}) poster`}
                width={width}
                height={height}
                className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
                onError={() => {
                    if (!error) {
                        setError(true);
                        setLoaded(true);
                    }
                }}
                priority={priority}
                unoptimized={imageUrl.includes('bing.net')} // Bing URLs sometimes fail optimization
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
