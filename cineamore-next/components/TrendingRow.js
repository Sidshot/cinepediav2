'use client';

import { useRef } from 'react';
import Link from 'next/link';
import OptimizedPoster from './OptimizedPoster';

export default function TrendingRow({ movies }) {
    const scrollContainerRef = useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth * 0.8 : current.offsetWidth * 0.8;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <div className="mb-12 animate-fade-in relative group/section">
            {/* Header - Cineby Style with Yellow Gradient */}
            <div className="flex items-center gap-4 mb-6 pl-4 md:pl-8">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                    <span style={{
                        background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        WebkitTextStroke: '1px rgba(251,191,36,0.5)',
                        fontFamily: 'Impact, sans-serif'
                    }}>TOP</span>
                    <span style={{
                        background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        WebkitTextStroke: '1px rgba(251,191,36,0.5)',
                        fontFamily: 'Impact, sans-serif'
                    }}>10</span>
                </h2>
                <div className="text-sm text-[var(--muted)] uppercase tracking-widest font-bold">
                    <div>Content</div>
                    <div>Today</div>
                </div>
            </div>

            {/* Scroll Arrows */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-[var(--accent)] text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover/section:opacity-100 transition-all -translate-x-1/2 shadow-xl border border-white/10 hidden md:flex items-center justify-center"
                aria-label="Scroll left"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-[var(--accent)] text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover/section:opacity-100 transition-all translate-x-1/2 shadow-xl border border-white/10 hidden md:flex items-center justify-center"
                aria-label="Scroll right"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-2 md:gap-4 pb-8 pl-4 md:pl-8 scrollbar-hide snap-x"
            >
                {movies.map((movie, index) => {
                    const rank = index + 1;
                    return (
                        <div key={movie._id || movie.__id} className="relative group shrink-0 snap-start flex items-end">
                            {/* Big Number - BEHIND poster, Yellow Gradient */}
                            <span
                                className="text-[12rem] md:text-[14rem] font-black leading-none select-none z-0"
                                style={{
                                    fontFamily: 'Impact, sans-serif',
                                    background: 'linear-gradient(180deg, #fbbf24 0%, #b45309 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    WebkitTextStroke: '2px rgba(251,191,36,0.4)',
                                    marginRight: '-40px',
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                                }}
                            >
                                {rank}
                            </span>

                            {/* Poster Card - IN FRONT of number */}
                            <Link
                                href={`/movie/${movie._id || movie.__id}`}
                                className="block relative z-10 w-[120px] md:w-[160px] transition-transform duration-300 group-hover:-translate-y-3 group-hover:scale-105"
                            >
                                <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 aspect-[2/3] relative">
                                    <OptimizedPoster
                                        src={movie.poster}
                                        title={movie.title}
                                        year={movie.year}
                                        width={160}
                                        height={240}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Persistent Rating Badge */}
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-white/30 px-2 py-1 rounded-lg flex items-center gap-1 shadow-xl z-20">
                                        <span className="text-yellow-400 text-xs">★</span>
                                        <span className="text-white text-xs font-bold">
                                            {movie.tmdbRating && movie.tmdbRating > 0 ? movie.tmdbRating.toFixed(1) : 'NR'}
                                        </span>
                                    </div>

                                    {/* Glass Overlay on Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <p className="text-white font-bold text-sm truncate">{movie.title}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    );
                })}
                {/* Spacer */}
                <div className="w-8 shrink-0"></div>
            </div>
        </div>
    );
}
