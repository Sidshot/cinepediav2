import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import Contributor from '@/models/Contributor';
import PendingChange from '@/models/PendingChange';
import { isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ContributorList from './ContributorList';

export default async function ContributorsPage() {
    // Ensure admin access
    const admin = await isAdmin();
    if (!admin) {
        redirect('/login');
    }

    await dbConnect();

    // Fetch all contributors
    const contributors = await Contributor.find({}).sort({ createdAt: -1 }).lean();

    // Get pending change counts per contributor
    const pendingCounts = await PendingChange.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: '$contributorId', count: { $sum: 1 } } }
    ]);

    const pendingMap = {};
    pendingCounts.forEach(p => {
        pendingMap[p._id.toString()] = p.count;
    });

    // Serialize for client
    const serializedContributors = contributors.map(c => ({
        _id: c._id.toString(),
        username: c.username,
        password: c.password,
        displayName: c.displayName || '',
        isActive: c.isActive,
        createdAt: c.createdAt?.toISOString() || null,
        pendingCount: pendingMap[c._id.toString()] || 0
    }));

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto bg-[var(--bg)]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Link href="/admin" className="text-[var(--muted)] hover:text-[var(--fg)] text-sm mb-2 inline-block transition">
                        ← Back to Admin Dashboard
                    </Link>
                    <h1 className="text-3xl font-extrabold text-[var(--fg)]">Manage Contributors</h1>
                    <p className="text-[var(--muted)]">Create and manage contributor accounts</p>
                </div>
            </header>

            <ContributorList contributors={serializedContributors} />
        </main>
    );
}
