import { logout } from '@/lib/auth';
import { deleteMovie } from '@/lib/actions';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import AdminSearch from '@/components/AdminSearch';
import DeleteButton from '@/components/DeleteButton';
import Link from 'next/link';

export default async function AdminDashboard({ searchParams }) {
    // STATIC MODE GUARD: If no DB, render maintenance view
    if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
        return (
            <main className="min-h-screen p-8 text-center flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold text-[var(--fg)] mb-4">Admin Dashboard Unavailable</h1>
                <p className="text-[var(--muted)]">Admin features are disabled in Static Preview mode.</p>
                <Link href="/" className="mt-8 text-[var(--accent)] hover:underline">Return Home</Link>
            </main>
        );
    }


    await dbConnect();
    const params = await searchParams; // Next 15 await
    const query = params?.q || '';

    // Helper to escape regex special characters
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Search Logic (reuse from Home, or simplified)
    const filter = query ? {
        $or: [
            { title: { $regex: escapeRegex(query), $options: 'i' } },
            { director: { $regex: escapeRegex(query), $options: 'i' } },
            // Year check needs casting if numeric, regex works if string or via aggregation. 
            // For simplicity in Admin regex title/director is usually enough.
        ]
    } : {};

    // Limit to 50 for admin perf, no pagination yet for simplicity
    const movies = await Movie.find(filter).sort({ addedAt: -1 }).limit(50).lean();

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto bg-[var(--bg)]">
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-[var(--border)] pb-6 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-[var(--fg)]">Admin Dashboard</h1>
                    <p className="text-[var(--muted)]">Manage your Infinite Cinema catalogue.</p>
                </div>

                <div className="flex gap-4 items-center flex-wrap justify-end">
                    <div className="flex gap-2 flex-wrap">
                        <a
                            href="/admin/contributors"
                            className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 font-bold px-4 py-2 rounded-xl transition text-sm flex items-center gap-2"
                            title="Manage Contributors"
                        >
                            <span>👥</span> Contributors
                        </a>
                        <a
                            href="/admin/pending"
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold px-4 py-2 rounded-xl transition text-sm flex items-center gap-2"
                            title="Review Pending Changes"
                        >
                            <span>📋</span> Pending
                        </a>
                        <a
                            href="/api/export/requests"
                            target="_blank"
                            className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-bold px-4 py-2 rounded-xl transition text-sm flex items-center gap-2"
                        >
                            <span>📥</span> Requests
                        </a>
                        <a
                            href="/api/export/reports"
                            target="_blank"
                            className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 font-bold px-4 py-2 rounded-xl transition text-sm flex items-center gap-2"
                        >
                            <span>📥</span> Reports
                        </a>
                        <a
                            href="/admin/auto-genre"
                            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 font-bold px-4 py-2 rounded-xl transition text-sm flex items-center gap-2"
                            title="Open Auto-Genre Manager"
                        >
                            <span>🪄</span> Auto-Genre
                        </a>
                        <a
                            href="/admin/import"
                            className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold px-4 py-2 rounded-xl transition text-sm flex items-center gap-2"
                            title="Bulk Import Movies"
                        >
                            <span>📦</span> Bulk Import
                        </a>
                    </div>

                    <Link
                        href="/admin/add"
                        className="bg-[var(--accent)] hover:brightness-110 text-[var(--bg)] font-bold px-6 py-2 rounded-xl transition shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]"
                    >
                        + Add Movie
                    </Link>
                    <form action={logout}>
                        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold px-6 py-2 rounded-xl transition">
                            Log Out
                        </button>
                    </form>
                </div>
            </header>

            <div className="mb-8 max-w-md">
                <AdminSearch placeholder="Search movies to edit..." />
            </div>

            <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border)] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black/20 text-[var(--muted)] text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-bold border-b border-[var(--border)]">Title</th>
                            <th className="p-4 font-bold border-b border-[var(--border)] hidden md:table-cell">Details</th>
                            <th className="p-4 font-bold border-b border-[var(--border)] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {movies.map(movie => {
                            const id = movie._id.toString();
                            return (
                                <tr key={id} className="hover:bg-white/5 transition group">
                                    <td className="p-4">
                                        <div className="font-bold text-[var(--fg)] flex items-center gap-2">
                                            {movie.title}
                                            {movie.visibility?.state === 'quarantined' && (
                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                                    Quarantined
                                                </span>
                                            )}
                                            {movie.visibility?.state === 'hidden' && (
                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                    Hidden
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-[var(--muted)] md:hidden">{movie.year} • {movie.director}</div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <div className="text-sm text-[var(--muted)]">
                                            <span className="text-[var(--fg)]">{movie.year}</span>
                                            <span className="mx-2">•</span>
                                            {movie.director}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-3 items-center">
                                        <Link
                                            href={`/admin/edit/${id}`}
                                            className="text-sm font-bold text-[var(--accent)] hover:underline opacity-80 hover:opacity-100"
                                        >
                                            Edit
                                        </Link>
                                        <DeleteButton id={id} deleteAction={deleteMovie} />
                                    </td>
                                </tr>
                            );
                        })}
                        {movies.length === 0 && (
                            <tr>
                                <td colSpan="3" className="p-8 text-center text-[var(--muted)]">
                                    No movies found matching "{query}".
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {movies.length >= 50 && (
                <p className="text-center text-[var(--muted)] text-xs mt-4">Showing most recent 50 results. Use search to find specific items.</p>
            )}
        </main>
    );
}
