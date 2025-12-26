'use client';

import Link from 'next/link';
import { useRef, memo } from 'react';
import { motion } from 'framer-motion';

function SeriesGenreRow({ title, genreId, series }) {
    const scrollRef = useRef(null);

    if (!series || series.length === 0) return null;

    const scrollLeft = () => {
        scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
    };

    const scrollRight = () => {
        scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
    };

    return (
        <section className="mb-10 group/row">
            {/* Header with View All */}
            <div className="flex items-center justify-between mb-4 px-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 rounded-full bg-orange-500"></span>
                    {title}
                </h2>
                {genreId && (
                    <Link
                        href={`/series/genre/${genreId}`}
                        className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 hover:bg-orange-500/20 px-4 py-2 rounded-full border border-orange-500/30"
                    >
                        View All
                    </Link>
                )}
            </div>

            {/* Scrollable Row - py-4 for scale overflow space */}
            <div className="relative">
                <div
                    ref={scrollRef}
                    className="flex gap-8 overflow-x-auto py-10 px-4 scrollbar-hide"
                >
                    {series.map((s, index) => (
                        <SeriesCard key={s.id} series={s} index={index} />
                    ))}
                </div>

                {/* Scroll Arrows - scoped to row hover */}
                <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity z-10 hover:bg-black/90"
                    onClick={scrollLeft}
                >
                    ←
                </button>
                <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity z-10 hover:bg-black/90"
                    onClick={scrollRight}
                >
                    →
                </button>
            </div>
        </section>
    );
}

// Wrap with React.memo
export default memo(SeriesGenreRow);


// Series Card Component - Premium glassmorphism version
function SeriesCard({ series, index }) {
    const posterUrl = series.poster_path
        ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
        : null;
    const year = series.first_air_date?.split('-')[0] || '';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{
                scale: 1.03,
                transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
            }}
            className="flex-none w-[160px] sm:w-[180px] relative"
            style={{ willChange: 'transform' }}
        >
            {/* Fixed Badges */}
            <div className="absolute top-2 left-2 z-50 pointer-events-none">
                <div
                    className="px-2 py-1 rounded-full flex items-center gap-1 shadow-lg bg-black/70 border border-white/10"
                >
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-white text-xs font-bold">
                        {series.vote_average ? series.vote_average.toFixed(1) : 'NR'}
                    </span>
                </div>
            </div>

            <div className="absolute top-2 right-2 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-50 shadow-lg">
                STREAM
            </div>

            {/* Simplified Glass - NO BLUR */}
            <div className="relative">
                {/* Back Shadow - solid only */}
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

                <Link href={`/series/${series.id}`} className="block relative aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black"
                    style={{
                        clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
                        transform: 'translateZ(0)'
                    }}
                >
                    {/* Poster */}
                    <div className="absolute inset-0 z-10" style={{ transform: 'translateZ(0)' }}>
                        {posterUrl ? (
                            <img
                                src={posterUrl}
                                alt={series.name}
                                className="w-full h-full object-cover"
                                style={{ filter: 'contrast(0.92) saturate(0.85)' }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                                No Poster
                            </div>
                        )}
                    </div>

                    {/* Poster Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-15"></div>

                    {/* Simple Glass Overlay - NO BLUR */}
                    <div
                        className="absolute inset-0 rounded-2xl pointer-events-none z-20"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04))',
                            opacity: 0.5,
                            boxShadow: 'inset -1px -1px 2px rgba(255, 255, 255, 0.15), inset 1px 1px 2px rgba(255, 255, 255, 0.1)',
                            clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)'
                        }}
                    ></div>

                    {/* Hover Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end p-3 z-25"
                    >
                        <span className="text-white font-medium text-sm line-clamp-2">{series.name}</span>
                    </motion.div>
                </Link>
            </div>

            <div className="mt-2 px-1">
                <Link href={`/series/${series.id}`} className="block">
                    <h3 className="font-bold text-[var(--fg)] text-sm truncate hover:text-orange-400 transition-colors">
                        {series.name}
                    </h3>
                </Link>
                <p className="text-xs text-[var(--muted)]">{year || '—'}</p>
            </div>
        </motion.div >
    );
}
