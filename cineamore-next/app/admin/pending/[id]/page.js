import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import PendingChange from '@/models/PendingChange';
import { isAdmin } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import PendingDetail from './PendingDetail';

export default async function PendingDetailPage({ params }) {
    const admin = await isAdmin();
    if (!admin) {
        redirect('/login');
    }

    await dbConnect();
    const { id } = await params;

    const change = await PendingChange.findById(id).lean();
    if (!change) notFound();

    const serializedChange = {
        _id: change._id.toString(),
        type: change.type,
        movieId: change.movieId?.toString() || null,
        movieData: change.movieData,
        previousData: change.previousData,
        contributorUsername: change.contributorUsername,
        status: change.status,
        createdAt: change.createdAt?.toISOString() || null,
        reviewedAt: change.reviewedAt?.toISOString() || null,
        reviewedBy: change.reviewedBy,
        reviewNotes: change.reviewNotes
    };

    const typeLabels = {
        create: { label: 'New Movie', color: 'text-green-400', bg: 'bg-green-500/10' },
        update: { label: 'Movie Update', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        delete: { label: 'Movie Deletion', color: 'text-red-400', bg: 'bg-red-500/10' }
    };

    const typeInfo = typeLabels[change.type] || { label: 'Change', color: 'text-white', bg: 'bg-white/10' };

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto bg-[var(--bg)]">
            <header className="mb-8">
                <Link href="/admin/pending" className="text-[var(--muted)] hover:text-[var(--fg)] text-sm mb-2 inline-block transition">
                    ← Back to Pending Changes
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${change.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                            change.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                'bg-red-500/20 text-red-400'
                        }`}>
                        {change.status.toUpperCase()}
                    </span>
                </div>
                <h1 className="text-3xl font-extrabold text-[var(--fg)]">
                    {change.movieData?.title || 'Untitled'}
                </h1>
                <p className="text-[var(--muted)]">
                    Submitted by <span className="text-[var(--accent)] font-bold">@{change.contributorUsername}</span>
                    {change.createdAt && ` on ${new Date(change.createdAt).toLocaleDateString()}`}
                </p>
            </header>

            <PendingDetail change={serializedChange} />
        </main>
    );
}
