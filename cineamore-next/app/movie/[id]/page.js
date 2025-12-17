import Link from 'next/link';
import InteractiveRating from '@/components/InteractiveRating';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import mongoose from 'mongoose';
import { getPosterUrl, getBackdropUrl } from '@/lib/images';
import staticData from '@/lib/movies.json';

// Force dynamic rendering if params are not known static (which they aren't)
// actually in Next 13+ app dir, dynamic segments are dynamic by default if not generated static.

export async function generateMetadata({ params }) {
    const { id } = await params;
    let movie;

    // 1. Try DB
    if (process.env.MONGODB_URI) {
        try {
            await dbConnect();
            if (mongoose.Types.ObjectId.isValid(id)) {
                movie = await Movie.findOne({ _id: id }).select('title year director').lean();
            } else {
                movie = await Movie.findOne({ __id: id }).select('title year director').lean();
            }
        } catch (e) { console.warn('DB metadata lookup failed', e); }
    }

    // 2. Static Fallback
    if (!movie) {
        try {
            movie = staticData.find(m => m._id === id || m.__id === id);
        } catch (e) { console.warn('Static metadata lookup failed', e); }
    }

    if (!movie) return { title: 'Film Not Found' };

    return {
        title: `${movie.title} (${movie.year}) - CineAmore`,
        description: `Watch ${movie.title} directed by ${movie.director || 'Unknown'}.`
    };
}

export default async function MoviePage({ params }) {
    const { id } = await params;
    let movie;

    // 1. Try DB Lookup if configured
    if (process.env.MONGODB_URI) {
        try {
            await dbConnect();
            if (mongoose.Types.ObjectId.isValid(id)) {
                movie = await Movie.findOne({ _id: id }).lean();
            } else {
                movie = await Movie.findOne({ __id: id }).lean();
            }

            if (movie) {
                // Deep serialize all MongoDB types for Client Components
                movie._id = movie._id.toString();
                if (movie.__id) movie.__id = String(movie.__id);
                if (movie.addedAt && typeof movie.addedAt.toISOString === 'function') {
                    movie.addedAt = movie.addedAt.toISOString();
                } else if (movie.addedAt) {
                    movie.addedAt = String(movie.addedAt);
                }
                // Serialize ratingSum and ratingCount to plain numbers
                movie.ratingSum = Number(movie.ratingSum) || 0;
                movie.ratingCount = Number(movie.ratingCount) || 0;
                // Serialize downloadLinks subdocuments
                if (movie.downloadLinks && Array.isArray(movie.downloadLinks)) {
                    movie.downloadLinks = movie.downloadLinks.map(link => ({
                        label: link.label || 'Download',
                        url: link.url || '',
                        _id: link._id ? link._id.toString() : undefined,
                        addedAt: link.addedAt ? (typeof link.addedAt.toISOString === 'function' ? link.addedAt.toISOString() : String(link.addedAt)) : undefined
                    }));
                }
            }
        } catch (err) {
            console.warn('DB Lookup failed, attempting static fallback:', err);
        }
    }

    // 2. Static Fallback (if no DB, DB failed, or movie not found in DB)
    if (!movie) {
        try {
            movie = staticData.find(m => m._id === id || m.__id === id);
        } catch (e) {
            console.error('Static fallback error:', e);
        }
    }

    if (!movie) notFound();

    // 3. Wikipedia Plot Fallback
    if (!movie.plot || movie.plot === 'No plot summary available.') {
        const wikiPlot = await fetchWikipediaSummary(movie.title, movie.year);
        if (wikiPlot) movie.plot = wikiPlot;
    }

    // Parse Links
    // Backward compatibility for 'dl' and 'drive' fields
    const links = movie.downloadLinks || [];
    if (links.length === 0) {
        if (movie.dl) links.push({ label: 'Download', url: movie.dl });
        if (movie.drive) links.push({ label: 'Google Drive', url: movie.drive });
    }

    const posterUrl = getPosterUrl(movie.title, movie.year, movie.poster);
    const backdropUrl = getBackdropUrl(movie.title, movie.year, movie.backdrop);

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

                    <div className="flex gap-4 py-6 border-y border-white/10 justify-center md:justify-start">
                        <InteractiveRating
                            movieId={movie._id || movie.__id}
                            initialSum={movie.ratingSum}
                            initialCount={movie.ratingCount}
                        />
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

                    {/* External Actions */}
                    <div className="flex flex-wrap gap-3">
                        <a href={movie.letterboxd ? (movie.letterboxd.startsWith('http') ? movie.letterboxd : `https://letterboxd.com/film/${movie.letterboxd}`) : `https://letterboxd.com/search/${encodeURIComponent(movie.title)}`} target="_blank" className="glossy-box social-link letterboxd flex-1">
                            <span className="text-xl mr-2">●</span> Letterboxd
                        </a>
                        <a href={movie.imdb ? (movie.imdb.startsWith('http') ? movie.imdb : `https://www.imdb.com/title/${movie.imdb}`) : `https://www.imdb.com/find?q=${encodeURIComponent(movie.title + ' ' + movie.year)}`} target="_blank" className="glossy-box social-link imdb flex-1">
                            <span className="font-black text-lg mr-2">IMDb</span>
                        </a>
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(movie.title + ' ' + movie.year + ' movie')}`} target="_blank" className="glossy-box social-link google flex-1">
                            Google
                        </a>
                    </div>

                    {/* Plot & Notes */}
                    <div className="prose prose-invert max-w-none">
                        <h3 className="text-2xl font-bold text-white mb-2">Synopsis</h3>
                        <p className="text-lg leading-relaxed text-[var(--fg)]">
                            {movie.plot || movie.overview || "No plot summary available."}
                        </p>
                        {movie.notes && (
                            <div className="mt-6 p-4 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-lg">
                                <h4 className="text-yellow-500 font-bold uppercase text-xs tracking-wider mb-1">Editor's Notes</h4>
                                <p className="text-[var(--muted)] italic m-0">{movie.notes}</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}

// NextJS 15 requires async params
export const dynamicParams = true;

async function fetchWikipediaSummary(title, year) {
    try {
        const query = `${title} ${year || ''} film`;
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
        const searchRes = await fetch(searchUrl, { next: { revalidate: 3600 } }); // Cache for 1 hour
        const searchData = await searchRes.json();

        if (searchData.query?.search?.length > 0) {
            const pageId = searchData.query.search[0].pageid;
            const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=10&explaintext&pageids=${pageId}&format=json`;
            const extractRes = await fetch(extractUrl, { next: { revalidate: 3600 } });
            const extractData = await extractRes.json();
            return extractData.query?.pages?.[pageId]?.extract;
        }
    } catch (e) {
        console.error('Wiki Fetch Error:', e);
    }
    return null;
}
