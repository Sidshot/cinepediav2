import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import PendingChange from '@/models/PendingChange';
import Contributor from '@/models/Contributor';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { logout } from '@/lib/auth';
import ContributorGuide from '@/components/ContributorGuide';

export default async function ContributorDashboard({ searchParams }) {
    const session = await getSession();
    if (!session || (session.role !== 'contributor' && session.role !== 'admin')) {
        redirect('/login');
    }

    const params = await searchParams;
    const tab = params?.tab || 'pending';

    await dbConnect();

    // Check if contributor has seen the guide (only for contributors, not admins)
    let showGuide = false;
    if (session.role === 'contributor' && session.contributorId) {
        const contributor = await Contributor.findById(session.contributorId).lean();
        showGuide = contributor && !contributor.hasSeenGuide;
    }

    // Fetch pending changes for this contributor
    const query = session.role === 'admin'
        ? {} // Admin sees all
        : { contributorId: session.contributorId };

    // Get counts for tabs
    const pendingCount = await PendingChange.countDocuments({ ...query, status: 'pending' });
    const approvedCount = await PendingChange.countDocuments({ ...query, status: 'approved' });
    const rejectedCount = await PendingChange.countDocuments({ ...query, status: 'rejected' });

    // Get items for current tab
    let statusFilter = 'pending';
    if (tab === 'approved') statusFilter = 'approved';
    if (tab === 'rejected') statusFilter = 'rejected';

    const changes = await PendingChange.find({ ...query, status: statusFilter })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    const serializedChanges = changes.map(c => ({
        _id: c._id.toString(),
        type: c.type,
        movieData: c.movieData,
        previousData: c.previousData,
        contributorUsername: c.contributorUsername,
        status: c.status,
        createdAt: c.createdAt?.toISOString() || null,
        reviewedAt: c.reviewedAt?.toISOString() || null,
        reviewedBy: c.reviewedBy,
        reviewNotes: c.reviewNotes
    }));

    const typeColors = {
        create: 'bg-green-500/20 text-green-400',
        update: 'bg-yellow-500/20 text-yellow-400',
        delete: 'bg-red-500/20 text-red-400'
    };

    const typeIcons = {
        create: '➕',
        update: '✏️',
        delete: '🗑️'
    };

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto bg-[var(--bg)]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[var(--border)] pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--fg)]">
                        {session.role === 'admin' ? 'Contributor View' : 'Contributor Dashboard'}
                    </h1>
                    <p className="text-[var(--muted)]">
                        Welcome, <span className="text-[var(--accent)] font-bold">@{session.user}</span>
                        {session.displayName && ` (${session.displayName})`}
                    </p>
                </div>

                <div className="flex gap-3 flex-wrap">
                    <Link
                        href="/contributor/add"
                        title="Submit a new movie for admin approval"
                        className="bg-[var(--accent)] hover:brightness-110 text-[var(--bg)] font-bold px-6 py-2 rounded-xl transition"
                    >
                        + Add Movie
                    </Link>
                    {session.role === 'admin' && (
                        <Link
                            href="/admin"
                            title="Return to admin dashboard"
                            className="bg-purple-500/10 text-purple-400 font-bold px-6 py-2 rounded-xl hover:bg-purple-500/20 transition"
                        >
                            Admin Dashboard
                        </Link>
                    )}
                    <form action={logout}>
                        <button
                            title="Sign out of your account"
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold px-6 py-2 rounded-xl transition"
                        >
                            Log Out
                        </button>
                    </form>
                </div>
            </header>

            {/* First-Time Guide */}
            {showGuide && <ContributorGuide />}

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <Link
                    href="/contributor?tab=pending"
                    title="View changes waiting for admin review"
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition ${tab === 'pending' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-[var(--muted)] hover:bg-white/10'}`}
                >
                    Pending ({pendingCount})
                </Link>
                <Link
                    href="/contributor?tab=approved"
                    title="View changes that were approved and are now live"
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition ${tab === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-[var(--muted)] hover:bg-white/10'}`}
                >
                    Approved ({approvedCount})
                </Link>
                <Link
                    href="/contributor?tab=rejected"
                    title="View changes that were rejected (see admin notes)"
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition ${tab === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-[var(--muted)] hover:bg-white/10'}`}
                >
                    Rejected ({rejectedCount})
                </Link>
            </div>

            {/* Changes List */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
                {serializedChanges.length === 0 ? (
                    <div className="p-12 text-center text-[var(--muted)]">
                        {tab === 'pending' && 'No pending changes. Add a movie to get started!'}
                        {tab === 'approved' && 'No approved changes yet.'}
                        {tab === 'rejected' && 'No rejected changes.'}
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-black/20 text-[var(--muted)] text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4" title="Type of change (Create/Update/Delete)">Type</th>
                                <th className="p-4" title="Movie title and details">Movie</th>
                                <th className="p-4 hidden md:table-cell" title="When you submitted this change">Submitted</th>
                                {tab !== 'pending' && <th className="p-4 hidden md:table-cell" title="When admin reviewed this">Reviewed</th>}
                                {tab === 'rejected' && <th className="p-4" title="Why the change was rejected">Admin Note</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {serializedChanges.map(change => (
                                <tr key={change._id} className="hover:bg-white/5 transition">
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeColors[change.type]}`}>
                                            {typeIcons[change.type]} {change.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-[var(--fg)]">{change.movieData?.title || '—'}</div>
                                        <div className="text-xs text-[var(--muted)]">
                                            {change.movieData?.year || '—'} • {change.movieData?.director || 'Unknown'}
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-sm text-[var(--muted)]">
                                        {change.createdAt ? new Date(change.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    {tab !== 'pending' && (
                                        <td className="p-4 hidden md:table-cell text-sm text-[var(--muted)]">
                                            {change.reviewedAt ? new Date(change.reviewedAt).toLocaleDateString() : '—'}
                                            {change.reviewedBy && <span className="ml-1">by {change.reviewedBy}</span>}
                                        </td>
                                    )}
                                    {tab === 'rejected' && (
                                        <td className="p-4 text-sm text-red-400">
                                            {change.reviewNotes || '—'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}
