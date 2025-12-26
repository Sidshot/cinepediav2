'use client';

import { useRef, memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import OptimizedPoster from './OptimizedPoster';
import AddToListButton from './AddToListButton';

function GenreRow({ title, movies, genreId, viewAllUrl }) {
    const scrollContainerRef = useRef(null);

    // Determine the link target
    const linkTarget = viewAllUrl || `/?genre=${encodeURIComponent(genreId)}`;

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <section className="mb-12 relative group/section">
            <div className="flex items-center justify-between pl-4 mb-4 border-l-4 border-[var(--accent)]">
                <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--fg)] tracking-wide uppercase">
                    {title}
                </h2>
                <Link
                    href={linkTarget}
                    className="text-sm font-bold text-[var(--accent)] hover:text-white transition-colors bg-[var(--accent)]/10 px-4 py-2 rounded-full border border-[var(--accent)]/20 hover:bg-[var(--accent)]"
                >
                    View All
                </Link>
            </div>

            <div className="relative group">
                {/* Scroll Buttons */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-[var(--accent)] text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all -translate-x-1/2 shadow-xl border border-white/10 hidden md:block"
                    aria-label="Scroll left"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-[var(--accent)] text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all translate-x-1/2 shadow-xl border border-white/10 hidden md:block"
                    aria-label="Scroll right"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                {/* Horizontal Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-8 overflow-x-auto pb-12 pt-16 px-1 snap-x scrollbar-hide -mx-2 px-2 mask-linear-fade"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {movies.map((movie, index) => (
                        <motion.div
                            key={movie._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            whileHover={{
                                scale: 1.08,
                                y: -10,
                                rotateY: 5,
                                transition: { duration: 0.3, ease: 'easeOut' }
                            }}
                            className="flex-none w-[160px] sm:w-[180px] md:w-[200px] snap-start group/card relative"
                        >
                            {/* Fixed Badges - Outside transform context */}
                            {/* Rating Badge - Always Visible, No Movement */}
                            <div className="absolute top-2 left-2 z-50 pointer-events-none">
                                <div
                                    className="px-2 py-1 rounded-full flex items-center gap-1 shadow-lg"
                                    style={{
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    <span className="text-yellow-400 text-xs">★</span>
                                    <span className="text-white text-xs font-bold">
                                        {movie.vote_average ? movie.vote_average.toFixed(1) : (movie.tmdbRating && movie.tmdbRating > 0 ? movie.tmdbRating.toFixed(1) : 'NR')}
                                    </span>
                                </div>
                            </div>

                            {/* Quick Add Button - STREAM accent badge */}
                            <div className="absolute top-2 right-2 z-50 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <AddToListButton movieId={movie._id || movie.__id} movieTitle={movie.title} variant="icon" />
                            </div>

                            {/* Card with transform */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                whileHover={{
                                    scale: 1.03,
                                    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
                                }}
                                className="film-tile"
                                style={{ willChange: 'transform' }}
                            >
                                {/* Simplified Glass Structure - NO BLUR for performance */}
                                <div className="relative">
                                    {/* Back Shadow Layer - solid gradient, no blur */}
                                    <div
                                        className="absolute inset-0 rounded-2xl"
                                        style={{
                                            transform: 'translate(-8px, -8px) translateZ(0)',
                                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
                                            opacity: 0.4,
                                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                                            clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)'
                                        }}
                                    ></div>

                                    {/* Main Content Container */}
                                    <Link href={`/movie/${movie.__id || movie._id}`} className="block relative aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black"
                                        style={{
                                            clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
                                            transform: 'translateZ(0)'
                                        }}
                                    >
                                        {/* Poster Layer */}
                                        <div className="absolute inset-0 z-10" style={{ transform: 'translateZ(0)' }}>
                                            <OptimizedPoster
                                                src={movie.poster}
                                                title={movie.title}
                                                year={movie.year}
                                                width={200}
                                                height={300}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Poster Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-15"></div>

                                        {/* Simple Glass Overlay - NO BLUR, just gradient */}
                                        <div
                                            className="absolute inset-0 rounded-2xl pointer-events-none z-20"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04))',
                                                opacity: 0.5,
                                                boxShadow: 'inset -1px -1px 2px rgba(255, 255, 255, 0.15), inset 1px 1px 2px rgba(255, 255, 255, 0.1)',
                                                clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)'
                                            }}
                                        ></div>

                                        {/* Hover Title Overlay */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            whileHover={{ opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end p-3 z-25"
                                        >
                                            <span className="text-white font-medium text-sm line-clamp-2">{movie.title}</span>
                                        </motion.div>
                                    </Link>
                                </div>
                            </motion.div>
                            <div className="mt-2 px-1">
                                <Link href={`/movie/${movie.__id || movie._id}`} className="block">
                                    <h3 className="font-bold text-[var(--fg)] text-sm truncate hover:text-[var(--accent)] transition-colors">{movie.title}</h3>
                                </Link>
                                <p className="text-xs text-[var(--muted)]">{movie.year || '—'}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Wrap with React.memo to prevent unnecessary re-renders
export default memo(GenreRow);
