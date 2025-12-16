import { auth } from '@/lib/auth-next';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import List from '@/models/List';
import User from '@/models/User';
import Link from 'next/link';
import { signOut } from '@/lib/auth-next';

export const metadata = {
    title: 'Profile | CineAmore',
    description: 'Your CineAmore profile'
};

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/api/auth/signin?callbackUrl=/profile');
    }

    await dbConnect();

    // Get user data
    const user = await User.findById(session.user.id).lean();

    // Get user's lists with stats
    const lists = await List.find({ owner: session.user.id })
        .select('title type isPublic movies createdAt')
        .lean();

    // Calculate stats
    const totalMovies = lists.reduce((sum, list) => sum + list.movies.length, 0);
    const uniqueMovieIds = new Set(lists.flatMap(list => list.movies.map(m => m.toString())));
    const uniqueMovies = uniqueMovieIds.size;

    const stats = {
        totalLists: lists.length,
        watchlistCount: lists.find(l => l.type === 'watchlist')?.movies.length || 0,
        favoritesCount: lists.find(l => l.type === 'favorites')?.movies.length || 0,
        totalSaved: totalMovies,
        uniqueMovies
    };

    return (
        <main className="min-h-screen p-8 max-w-[800px] mx-auto">
            {/* Profile Card */}
            <div className="card-gloss rounded-3xl p-8 mb-8">
                <div className="flex items-center gap-6">
                    {session.user.image && (
                        <img
                            src={session.user.image}
                            alt={session.user.name}
                            className="w-24 h-24 rounded-full border-4 border-[var(--accent)]/20"
                        />
                    )}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-[var(--fg)]">{session.user.name}</h1>
                        <p className="text-[var(--muted)]">{session.user.email}</p>
                        <p className="text-sm text-[var(--muted)] mt-1">
                            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                    <form action={async () => {
                        'use server';
                        await signOut({ redirectTo: '/' });
                    }}>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-white/5 text-[var(--muted)] hover:text-[var(--fg)] hover:bg-white/10 transition-colors"
                        >
                            Sign Out
                        </button>
                    </form>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card-gloss rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold text-[var(--accent)]">{stats.totalLists}</div>
                    <div className="text-sm text-[var(--muted)]">Lists</div>
                </div>
                <div className="card-gloss rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold text-[var(--accent)]">{stats.watchlistCount}</div>
                    <div className="text-sm text-[var(--muted)]">Watchlist</div>
                </div>
                <div className="card-gloss rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold text-[var(--accent)]">{stats.favoritesCount}</div>
                    <div className="text-sm text-[var(--muted)]">Favorites</div>
                </div>
                <div className="card-gloss rounded-2xl p-6 text-center">
                    <div className="text-3xl font-bold text-[var(--accent)]">{stats.uniqueMovies}</div>
                    <div className="text-sm text-[var(--muted)]">Unique Movies</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-[var(--fg)]">Quick Actions</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        href="/lists"
                        className="flex items-center gap-4 p-4 rounded-2xl card-gloss hover:-translate-y-1 transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                            <svg className="w-6 h-6 fill-[var(--accent)]" viewBox="0 0 24 24">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--fg)]">My Lists</h3>
                            <p className="text-sm text-[var(--muted)]">View and manage your collections</p>
                        </div>
                    </Link>

                    <Link
                        href="/"
                        className="flex items-center gap-4 p-4 rounded-2xl card-gloss hover:-translate-y-1 transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                            <svg className="w-6 h-6 fill-[var(--accent)]" viewBox="0 0 24 24">
                                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--fg)]">Browse Movies</h3>
                            <p className="text-sm text-[var(--muted)]">Discover and save new films</p>
                        </div>
                    </Link>
                </div>
            </div>
        </main>
    );
}
