'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { searchMovies, getMovieDetails } from '@/lib/tmdb';

export default function MovieForm({ action, defaultValues = {}, cancelUrl = '/admin' }) {
    const router = useRouter();
    // State for Form Fields (Controlled to allow Auto-Fill)
    const [formData, setFormData] = useState({
        title: defaultValues.title || '',
        year: defaultValues.year || '',
        director: defaultValues.director || '',
        original: defaultValues.original || '',
        plot: defaultValues.plot || '',
        genre: defaultValues.genre ? defaultValues.genre.join(', ') : '',
        lb: defaultValues.lb || '',
        poster: defaultValues.poster || '',
        notes: defaultValues.notes || '',
        downloadLinks: defaultValues.downloadLinks
            ? defaultValues.downloadLinks.map(l => `${l.label} | ${l.url}`).join('\n')
            : ''
    });

    // TMDB Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = async () => {
        if (!query.trim()) return;
        setSearching(true);
        const res = await searchMovies(query);
        if (Array.isArray(res)) {
            setResults(res);
        }
        setSearching(false);
    };

    const handleSelect = async (tmdbId) => {
        setLoading(true);
        const details = await getMovieDetails(tmdbId);
        if (details && !details.error) {
            setFormData(prev => ({
                ...prev,
                title: details.title,
                year: details.year,
                director: details.director,
                original: details.original,
                poster: details.poster_path,
                plot: details.plot || details.overview || '', // Map overview to plot
                genre: details.genre ? details.genre.join(', ') : '',
                // notes: details.notes, // Notes are usually empty from TMDB, handled manually
                // We don't overwrite LB or Download links usually, but we could if we had them
            }));
            setResults([]); // Clear results
            setQuery(''); // Clear search
        }
        setLoading(false);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">

            {/* ✨ Magic Search Bar */}
            <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--border)] shadow-xl backdrop-blur-md relative z-20">
                <div className="flex gap-4">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="✨ Magic Auto-Fill: Type a movie name..."
                        className="flex-1 h-12 px-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={searching}
                        className="px-6 h-12 bg-white/10 hover:bg-white/20 text-[var(--fg)] font-bold rounded-xl transition"
                    >
                        {searching ? '...' : 'Search'}
                    </button>
                </div>

                {/* Results Dropdown */}
                {results.length > 0 && (
                    <div className="absolute top-20 left-0 w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden z-50 p-2">
                        {results.map(movie => (
                            <button
                                key={movie.id}
                                onClick={() => handleSelect(movie.id)}
                                className="w-full text-left p-3 hover:bg-white/10 rounded-lg flex items-center gap-4 transition"
                            >
                                {movie.poster_path && (
                                    <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} className="w-10 h-14 object-cover rounded" alt="" />
                                )}
                                <div>
                                    <div className="font-bold text-[var(--fg)]">{movie.title}</div>
                                    <div className="text-sm text-[var(--muted)]">{movie.release_date?.split('-')[0]}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Form */}
            <form
                action={async (formData) => {
                    const result = await action(formData);
                    // If action returns success (contributor mode), redirect back
                    if (result?.success) {
                        router.push(cancelUrl);
                    }
                    // If action returns error, it will be handled by the form
                    // Admin actions use redirect() directly
                }}
                className={`bg-[var(--card-bg)] p-8 rounded-3xl border border-[var(--border)] shadow-2xl backdrop-blur-md space-y-6 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
            >

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">Title</label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full h-12 px-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">Year</label>
                        <input
                            name="year"
                            type="number"
                            min="1888"
                            value={formData.year}
                            onChange={handleChange}
                            required
                            className="w-full h-12 px-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">Director</label>
                        <input
                            name="director"
                            value={formData.director}
                            onChange={handleChange}
                            className="w-full h-12 px-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">Original Title</label>
                        <input
                            name="original"
                            value={formData.original}
                            onChange={handleChange}
                            className="w-full h-12 px-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">Genres (Comma Separated)</label>
                    <input
                        name="genre"
                        value={formData.genre}
                        onChange={handleChange}
                        placeholder="Action, Sci-Fi, Drama"
                        className="w-full h-12 px-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">Letterboxd URL</label>
                    <input
                        name="lb"
                        type="url"
                        value={formData.lb}
                        onChange={handleChange}
                        className="w-full h-12 px-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">Poster URL / Path</label>
                    <input
                        name="poster"
                        value={formData.poster}
                        onChange={handleChange}
                        placeholder="/path.jpg or https://..."
                        className="w-full h-12 px-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">Plot Summary</label>
                    <textarea
                        name="plot"
                        value={formData.plot}
                        onChange={handleChange}
                        rows={6}
                        className="w-full p-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">Editor's Notes (Optional)</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        className="w-full p-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] focus:border-[var(--accent)] outline-none resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">Download Links</label>
                    <p className="text-[10px] text-[var(--muted)] mb-2">Format per line: "Label | URL"</p>
                    <textarea
                        name="downloadLinks"
                        value={formData.downloadLinks}
                        onChange={handleChange}
                        placeholder="Download 1080p | https://example.com/file.mkv"
                        rows={4}
                        className="w-full p-4 rounded-xl bg-black/20 border border-[var(--border)] text-[var(--fg)] font-mono text-sm focus:border-[var(--accent)] outline-none resize-none"
                    />
                </div>

                <div className="pt-4 flex gap-4">
                    <button
                        type="submit"
                        className="flex-1 h-12 bg-[var(--accent)] hover:brightness-110 text-[var(--bg)] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)]"
                    >
                        {defaultValues.title ? 'Update Movie' : 'Add Movie'}
                    </button>
                    <a href={cancelUrl} className="h-12 px-6 flex items-center justify-center bg-white/5 hover:bg-white/10 text-[var(--fg)] font-bold rounded-xl transition">
                        Cancel
                    </a>
                </div>
            </form>
        </div>
    );
}
