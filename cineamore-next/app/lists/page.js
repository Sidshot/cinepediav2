import { auth } from '@/lib/auth-next';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import List from '@/models/List';
import Link from 'next/link';
import CreateListForm from './CreateListForm';

export const metadata = {
    title: 'My Lists | CineAmore',
    description: 'Manage your movie collections'
};

export default async function ListsPage({ searchParams }) {
    const session = await auth();

    if (!session?.user) {
        redirect('/api/auth/signin?callbackUrl=/lists');
    }

    await dbConnect();

    const lists = await List.find({ owner: session.user.id })
        .populate('movies', 'title year poster _id')
        .sort({ updatedAt: -1 })
        .lean();

    // Serialize
    const serializedLists = lists.map(list => ({
        ...list,
        _id: list._id.toString(),
        owner: list.owner.toString(),
        movies: list.movies.map(m => ({
            ...m,
            _id: m._id.toString()
        })),
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString()
    }));

    const params = await searchParams;
    const showCreateForm = params?.new === 'true';

    return (
        <main className="min-h-screen p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--fg)]">My Lists</h1>
                    <p className="text-[var(--muted)] mt-1">
                        {serializedLists.length} {serializedLists.length === 1 ? 'list' : 'lists'}
                    </p>
                </div>

                <Link
                    href="/lists?new=true"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-black font-bold hover:opacity-90 transition-opacity"
                >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Create List
                </Link>
            </div>

            {/* Create List Form Modal */}
            {showCreateForm && <CreateListForm />}

            {/* Lists Grid */}
            {serializedLists.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-3xl">
                    <svg className="w-16 h-16 mx-auto mb-4 fill-[var(--muted)]" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                    <h3 className="text-xl font-bold text-[var(--fg)] mb-2">No lists yet</h3>
                    <p className="text-[var(--muted)] mb-6">Create your first list to start saving movies</p>
                    <Link
                        href="/lists?new=true"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-black font-bold"
                    >
                        Create Your First List
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {serializedLists.map(list => (
                        <Link
                            key={list._id}
                            href={`/lists/${list._id}`}
                            className="group block p-6 rounded-2xl card-gloss hover:-translate-y-1 transition-all"
                        >
                            {/* Movie Thumbnails Grid */}
                            <div className="grid grid-cols-4 gap-1 mb-4 aspect-[4/1.5] rounded-xl overflow-hidden bg-black/20">
                                {list.movies.slice(0, 4).map((movie, i) => (
                                    <div key={movie._id} className="relative">
                                        {movie.poster ? (
                                            <img
                                                src={movie.poster}
                                                alt={movie.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
                                                <span className="text-xs text-[var(--muted)]">{i + 1}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {list.movies.length < 4 && [...Array(4 - list.movies.length)].map((_, i) => (
                                    <div key={`empty-${i}`} className="bg-gradient-to-br from-white/5 to-transparent" />
                                ))}
                            </div>

                            {/* List Info */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-[var(--fg)] truncate group-hover:text-[var(--accent)] transition-colors">
                                        {list.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-[var(--muted)]">
                                        <span>{list.movies.length} {list.movies.length === 1 ? 'movie' : 'movies'}</span>
                                        {list.type !== 'custom' && (
                                            <>
                                                <span>•</span>
                                                <span className="capitalize">{list.type}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Visibility Badge */}
                                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${list.isPublic
                                        ? 'bg-green-500/10 text-green-400'
                                        : 'bg-white/5 text-[var(--muted)]'
                                    }`}>
                                    {list.isPublic ? 'Public' : 'Private'}
                                </div>
                            </div>

                            {list.description && (
                                <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">
                                    {list.description}
                                </p>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
