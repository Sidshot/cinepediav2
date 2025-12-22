import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import PendingChange from '@/models/PendingChange';
import { isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PendingList from './PendingList';

export default async function AdminPendingPage({ searchParams }) {
    const admin = await isAdmin();
    if (!admin) {
        redirect('/login');
    }

    const params = await searchParams;
    const typeFilter = params?.type || 'all';
    const statusFilter = params?.status || 'pending';

    await dbConnect();

    // Build query
    const query = {};
    if (typeFilter !== 'all') query.type = typeFilter;
    if (statusFilter !== 'all') query.status = statusFilter;

    // Get counts
    const pendingCount = await PendingChange.countDocuments({ status: 'pending' });
    const approvedCount = await PendingChange.countDocuments({ status: 'approved' });
    const rejectedCount = await PendingChange.countDocuments({ status: 'rejected' });

    // Get changes
    const changes = await PendingChange.find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

    const serializedChanges = changes.map(c => ({
        _id: c._id.toString(),
        type: c.type,
        movieId: c.movieId?.toString() || null,
        movieData: c.movieData,
        previousData: c.previousData,
        contributorUsername: c.contributorUsername,
        status: c.status,
        createdAt: c.createdAt?.toISOString() || null,
        reviewedAt: c.reviewedAt?.toISOString() || null,
        reviewedBy: c.reviewedBy,
        reviewNotes: c.reviewNotes
    }));

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto bg-[var(--bg)]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Link href="/admin" className="text-[var(--muted)] hover:text-[var(--fg)] text-sm mb-2 inline-block transition">
                        ← Back to Admin Dashboard
                    </Link>
                    <h1 className="text-3xl font-extrabold text-[var(--fg)]">Pending Changes</h1>
                    <p className="text-[var(--muted)]">Review and approve contributor submissions</p>
                </div>

                {/* Summary */}
                <div className="flex gap-3">
                    <Link
                        href="/admin/pending?status=pending"
                        className={`px-4 py-2 rounded-lg font-bold text-sm ${statusFilter === 'pending' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-[var(--muted)]'}`}
                    >
                        Pending ({pendingCount})
                    </Link>
                    <Link
                        href="/admin/pending?status=approved"
                        className={`px-4 py-2 rounded-lg font-bold text-sm ${statusFilter === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-[var(--muted)]'}`}
                    >
                        Approved ({approvedCount})
                    </Link>
                    <Link
                        href="/admin/pending?status=rejected"
                        className={`px-4 py-2 rounded-lg font-bold text-sm ${statusFilter === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-[var(--muted)]'}`}
                    >
                        Rejected ({rejectedCount})
                    </Link>
                </div>
            </header>

            {/* Type Filters */}
            <div className="flex gap-2 mb-6">
                <Link
                    href={`/admin/pending?status=${statusFilter}&type=all`}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${typeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-[var(--muted)]'}`}
                >
                    All Types
                </Link>
                <Link
                    href={`/admin/pending?status=${statusFilter}&type=create`}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${typeFilter === 'create' ? 'bg-green-500/30 text-green-400' : 'bg-white/5 text-[var(--muted)]'}`}
                >
                    ➕ Creates
                </Link>
                <Link
                    href={`/admin/pending?status=${statusFilter}&type=update`}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${typeFilter === 'update' ? 'bg-yellow-500/30 text-yellow-400' : 'bg-white/5 text-[var(--muted)]'}`}
                >
                    ✏️ Updates
                </Link>
                <Link
                    href={`/admin/pending?status=${statusFilter}&type=delete`}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${typeFilter === 'delete' ? 'bg-red-500/30 text-red-400' : 'bg-white/5 text-[var(--muted)]'}`}
                >
                    🗑️ Deletes
                </Link>
            </div>

            <PendingList changes={serializedChanges} isPending={statusFilter === 'pending'} />
        </main>
    );
}
