import { auth } from '@/lib/auth-next';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import List from '@/models/List';
import Link from 'next/link';
import ListActions from './ListActions';
import OptimizedPoster from '@/components/OptimizedPoster';

export async function generateMetadata({ params }) {
    const { id } = await params;
    await dbConnect();
    const list = await List.findById(id).select('title description').lean();

    if (!list) return { title: 'List Not Found' };

    return {
        title: `${list.title} | CineAmore`,
        description: list.description || `A movie collection on CineAmore`
    };
}

export default async function ListDetailPage({ params }) {
    const { id } = await params;
    const session = await auth();

    await dbConnect();

    const list = await List.findById(id)
        .populate('owner', 'name image')
        .populate('movies', 'title year poster director _id __id')
        .lean();

    if (!list) {
        notFound();
    }

    const isOwner = session?.user?.id === list.owner._id.toString();

    // Check access for private lists
    if (!list.isPublic && !isOwner) {
        return (
            <main className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 fill-[var(--muted)]" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
                    </svg>
                    <h1 className="text-2xl font-bold text-[var(--fg)] mb-2">Private List</h1>
                    <p className="text-[var(--muted)]">This list is private and can only be viewed by its owner.</p>
                </div>
            </main>
        );
    }

    // Serialize
    const serializedList = {
        ...list,
        _id: list._id.toString(),
        owner: {
            ...list.owner,
            _id: list.owner._id.toString()
        },
        movies: list.movies.map(m => ({
            ...m,
            _id: m._id.toString()
        })),
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString()
    };

    return (
        <main className="min-h-screen p-8 max-w-[1600px] mx-auto">
            {/* Back Link */}
            <Link
                href="/lists"
                className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--fg)] mb-6 transition-colors"
            >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Back to Lists
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 pb-8 border-b border-[var(--border)]">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-[var(--fg)]">{serializedList.title}</h1>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${serializedList.isPublic
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-white/5 text-[var(--muted)]'
                            }`}>
                            {serializedList.isPublic ? 'Public' : 'Private'}
                        </span>
                        {serializedList.type !== 'custom' && (
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] capitalize">
                                {serializedList.type}
                            </span>
                        )}
                    </div>

                    {serializedList.description && (
                        <p className="text-[var(--muted)] mb-4">{serializedList.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                        <div className="flex items-center gap-2">
                            {serializedList.owner.image && (
                                <img
                                    src={serializedList.owner.image}
                                    alt={serializedList.owner.name}
                                    className="w-6 h-6 rounded-full"
                                />
                            )}
                            <span>by {serializedList.owner.name}</span>
                        </div>
                        <span>•</span>
                        <span>{serializedList.movies.length} movies</span>
                    </div>
                </div>

                {/* Owner Actions */}
                {isOwner && (
                    <ListActions
                        listId={serializedList._id}
                        isPublic={serializedList.isPublic}
                    />
                )}
            </div>

            {/* Movies Grid */}
            {serializedList.movies.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-3xl">
                    <svg className="w-16 h-16 mx-auto mb-4 fill-[var(--muted)]" viewBox="0 0 24 24">
                        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                    </svg>
                    <h3 className="text-xl font-bold text-[var(--fg)] mb-2">No movies yet</h3>
                    <p className="text-[var(--muted)] mb-6">Add movies to this list from any movie card</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-black font-bold"
                    >
                        Browse Movies
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
                    {serializedList.movies.map(movie => (
                        <Link
                            key={movie._id}
                            href={`/movie/${movie._id || movie.__id}`}
                            className="group block"
                        >
                            <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-black/40 shadow-lg">
                                <OptimizedPoster
                                    src={movie.poster}
                                    title={movie.title}
                                    year={movie.year}
                                    width={200}
                                    height={300}
                                    className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <h3 className="font-bold text-[var(--fg)] truncate group-hover:text-[var(--accent)] transition-colors">
                                {movie.title}
                            </h3>
                            <p className="text-sm text-[var(--muted)]">
                                {movie.year} {movie.director && `• ${movie.director}`}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
