import Link from 'next/link';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import mongoose from 'mongoose';

// Force dynamic rendering if params are not known static (which they aren't)
// actually in Next 13+ app dir, dynamic segments are dynamic by default if not generated static.

export async function generateMetadata({ params }) {
    await dbConnect();
    const { id } = await params;

    let movie;

    // STATIC FALLBACK
    if (!process.env.MONGODB_URI) {
        try {
            const staticMovies = require('@/lib/movies.json');
            movie = staticMovies.find(m => m._id === id || m.__id === id);
        } catch (e) { console.warn('Static lookup failed', e); }
    } else {
        // DB LOOKUP
        if (mongoose.Types.ObjectId.isValid(id)) {
            movie = await Movie.findOne({ _id: id }).select('title year director').lean();
        } else {
            movie = await Movie.findOne({ __id: id }).select('title year director').lean();
        }
    }

    if (!movie) return { title: 'Film Not Found' };

    return {
        title: `${movie.title} (${movie.year}) - CineAmore`,
        description: `Watch ${movie.title} directed by ${movie.director || 'Unknown'}.`
    };
}

export default async function MoviePage({ params }) {
    await dbConnect();
    const { id } = await params;

    let movie;

    // STATIC FALLBACK
    if (!process.env.MONGODB_URI) {
        try {
            const staticMovies = require('@/lib/movies.json');
            movie = staticMovies.find(m => m._id === id || m.__id === id);
            // Simulate Mongoose serialization for dates/ids
            if (movie) {
                // Determine if ID is valid objectID style or simple string for clean checks
                // JSON data is already strings mostly
            }
        } catch (e) {
            console.error('Static fallback error:', e);
        }
    } else {
        // DB LOOKUP
        // Smart Lookup
        if (mongoose.Types.ObjectId.isValid(id)) {
            movie = await Movie.findOne({ _id: id }).lean();
        } else {
            movie = await Movie.findOne({ __id: id }).lean();
        }

        // Serialize dates for DB path only (JSON is already string)
        if (movie) {
            if (movie.addedAt) movie.addedAt = movie.addedAt.toISOString();
            movie._id = movie._id.toString();
        }
    }

    if (!movie) notFound();

    // Parse Links
    // Backward compatibility for 'dl' and 'drive' fields
    const links = movie.downloadLinks || [];
    if (links.length === 0) {
        if (movie.dl) links.push({ label: 'Download', url: movie.dl });
        if (movie.drive) links.push({ label: 'Google Drive', url: movie.drive });
    }

    const posterUrl = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(`"${movie.title}" (${movie.year}) film poster`)}&w=300&h=450&c=7&rs=1&p=0`;
    const backdropUrl = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(`"${movie.title}" (${movie.year}) film scene high quality`)}&w=1200&h=600&c=7&rs=1&p=0`;

    return (
        <main className="min-h-screen p-0 bg-[var(--bg)]">
            {/* Backdrop Hero */}
            <div className="relative w-full h-[60vh] overflow-hidden">
                <div className="absolute inset-0 bg-black/50 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/60 to-transparent z-20"></div>
                <img src={backdropUrl} className="w-full h-full object-cover opacity-60 blur-sm scale-110" alt="Backdrop" />

                <div className="absolute top-8 left-8 z-50">
                    <Link href="/" className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-white/90 font-medium hover:bg-white/10 transition">
                        ← Back to Library
                    </Link>
                </div>
            </div>

            {/* Content Container */}
            <div className="relative z-30 -mt-64 max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10">

                {/* Poster */}
                <div className="flex flex-col gap-6">
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[2/3] relative group">
                        <img src={posterUrl} className="w-full h-full object-cover" alt={movie.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6">
                            <a href={movie.lb || '#'} target="_blank" className="bg-[#ff8000] text-white font-bold px-6 py-3 rounded-xl w-full text-center hover:bg-[#e67300] transition">
                                View on Letterboxd
                            </a>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="pt-10 md:pt-32 flex flex-col gap-6 text-[var(--fg)]">
                    <div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-4 drop-shadow-xl">{movie.title}</h1>
                        <div className="flex flex-wrap gap-4 text-lg items-center text-[var(--muted)] font-medium">
                            <span className="bg-white/10 px-3 py-1 rounded-md border border-white/5">{movie.year}</span>
                            {movie.director && (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                                    <span>{movie.director}</span>
                                </>
                            )}
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                            <span>{movie.original || 'Original Title'}</span>
                        </div>
                    </div>

                    <div className="flex gap-4 py-6 border-y border-white/10">
                        {movie.ratingCount > 0 ? (
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-[var(--accent)]">
                                    {parseFloat(movie.ratingSum / movie.ratingCount).toFixed(1)} <span className="text-lg text-[var(--muted)]">/ 5</span>
                                </span>
                                <span className="text-xs uppercase tracking-widest text-[var(--muted)]">{movie.ratingCount} Ratings</span>
                            </div>
                        ) : (
                            <div className="text-[var(--muted)] italic">No ratings yet</div>
                        )}
                    </div>

                    {/* Links Section */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-[var(--accent)]">⬇</span> Download Links
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {links.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    className="bg-white/5 hover:bg-[var(--accent)] hover:text-black border border-white/10 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 group"
                                >
                                    {link.label || 'Download'}
                                    <svg className="w-4 h-4 opacity-50 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            ))}
                            {links.length === 0 && <span className="text-[var(--muted)]">No download links available.</span>}
                        </div>
                    </div>

                    {/* Plot Placeholder (If we had it in DB) or Wiki Embed Button */}
                    <div className="prose prose-invert max-w-none">
                        <p className="text-lg leading-relaxed text-[var(--muted)]">
                            {movie.notes || "No additional notes or plot summary available for this title."}
                        </p>
                    </div>

                </div>
            </div>
        </main>
    );
}

// NextJS 15 requires async params
export const dynamicParams = true; 
