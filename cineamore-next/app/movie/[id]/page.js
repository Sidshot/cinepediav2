import Link from 'next/link';
import BackToLibraryButton from '@/components/BackToLibraryButton';
import SecureDownloadButton from '@/components/SecureDownloadButton';
import InteractiveRating from '@/components/InteractiveRating';
import AddToListButton from '@/components/AddToListButton';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import mongoose from 'mongoose';
import { getPosterUrl, getBackdropUrl } from '@/lib/images';
import staticData from '@/lib/movies.json';
import ClientStreamingLoader from '@/components/ClientStreamingLoader';

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

    // QUOTA FIX: Wikipedia fetch disabled to save CPU - rely on stored plots
    // If movie has no plot, it will show default message
    // if (!movie.plot || movie.plot === 'No plot summary available.') {
    //     const wikiPlot = await fetchWikipediaSummary(movie.title, movie.year);
    //     if (wikiPlot) movie.plot = wikiPlot;
    // }

    // Parse Links
    // Backward compatibility for 'dl' and 'drive' fields
    const links = movie.downloadLinks || [];
    if (links.length === 0) {
        if (movie.dl) links.push({ label: 'Download', url: movie.dl });
        if (movie.drive) links.push({ label: 'Google Drive', url: movie.drive });
    }

    const posterUrl = getPosterUrl(movie.title, movie.year, movie.poster);
    const backdropUrl = getBackdropUrl(movie.title, movie.year, movie.backdrop);

    // Streaming is now handled client-side to prevent ISR caching issues

    return (
        <main className="min-h-screen p-0 bg-[var(--bg)]">
            {/* Backdrop Hero */}
            <div className="relative w-full h-[60vh] overflow-hidden">
                <div className="absolute inset-0 bg-black/50 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/60 to-transparent z-20"></div>
                <img src={backdropUrl} className="w-full h-full object-cover opacity-60 blur-sm scale-110" alt="Backdrop" />

                <div className="absolute top-8 left-8 z-50">
                    <BackToLibraryButton />
                </div>
            </div>

            {/* Content Container */}
            <div className="relative z-30 -mt-64 max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10">

                {/* Poster */}
                <div className="flex flex-col gap-6">
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[2/3] relative group">
                        <img src={posterUrl} className="w-full h-full object-cover" alt={movie.title} />

                        {/* TMDB Rating Badge - Always Visible */}
                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl z-10">
                            <span className="text-yellow-400 text-base">★</span>
                            <span className="text-white text-sm font-bold">
                                {movie.tmdbRating && movie.tmdbRating > 0 ? movie.tmdbRating.toFixed(1) : 'NR'}
                            </span>
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

                    <div className="flex gap-4 py-6 border-y border-white/10 justify-center md:justify-start items-center flex-wrap">
                        <InteractiveRating
                            movieId={movie._id || movie.__id}
                            initialSum={movie.ratingSum}
                            initialCount={movie.ratingCount}
                        />

                        {/* Save to List Button */}
                        <AddToListButton
                            movieId={movie._id || movie.__id}
                            movieTitle={movie.title}
                            variant="full"
                        />
                    </div>

                    {/* Links Section */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-[var(--accent)]">⬇</span> Download Links
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {/* Primary Links (First 4) */}
                            {links.slice(0, 4).map((link, idx) => (
                                <SecureDownloadButton
                                    key={idx}
                                    movieId={movie._id || movie.__id}
                                    linkIndex={idx}
                                    label={link.label || 'Download'}
                                />
                            ))}

                            {/* More Links Dropdown (If > 4) */}
                            {links.length > 4 && (
                                <details className="relative group w-full sm:w-auto">
                                    <summary className="list-none cursor-pointer flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold bg-[var(--card-bg)] border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 transition-all select-none w-full sm:w-auto">
                                        <span>+{links.length - 4} More Links</span>
                                        <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </summary>
                                    <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-[var(--card-bg)]/95 backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-2xl p-3 grid gap-2 z-50 animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
                                        {links.slice(4).map((link, idx) => (
                                            <div key={idx + 4} className="w-full">
                                                <SecureDownloadButton
                                                    movieId={movie._id || movie.__id}
                                                    linkIndex={idx + 4}
                                                    label={link.label || `Download ${idx + 5}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}

                            {links.length === 0 && <span className="text-[var(--muted)]">No download links available.</span>}
                        </div>
                    </div>

                    {/* Streaming Player - Client-side to prevent caching issues */}
                    <ClientStreamingLoader title={movie.title} year={movie.year} />

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

// ISR: Revalidate popular movie pages every hour
export const revalidate = 86400; // QUOTA FIX: 24 hours

async function fetchWikipediaSummary(title, year) {
    try {
        const query = `${title} ${year || ''} film`;
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
        const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } }); // QUOTA FIX: 24 hours
        const searchData = await searchRes.json();

        if (searchData.query?.search?.length > 0) {
            const pageId = searchData.query.search[0].pageid;
            const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=10&explaintext&pageids=${pageId}&format=json`;
            const extractRes = await fetch(extractUrl, { next: { revalidate: 86400 } }); // QUOTA FIX
            const extractData = await extractRes.json();
            return extractData.query?.pages?.[pageId]?.extract;
        }
    } catch (e) {
        console.error('Wiki Fetch Error:', e);
    }
    return null;
}
