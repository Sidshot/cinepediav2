'use client';

import { useState } from 'react';
import Link from 'next/link';
import { approvePendingChange, rejectPendingChange, bulkApprovePendingChanges, bulkRejectPendingChanges, discardPendingChange } from '@/lib/adminApprovalActions';

export default function PendingList({ changes, isPending }) {
    const [selected, setSelected] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

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

    const toggleSelect = (id) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selected.length === changes.length) {
            setSelected([]);
        } else {
            setSelected(changes.map(c => c._id));
        }
    };

    const handleApprove = async (id) => {
        setProcessing(true);
        setError(null);
        const result = await approvePendingChange(id);
        if (result.error) {
            setError(result.error);
        } else {
            setSuccess('Change approved!');
            window.location.reload();
        }
        setProcessing(false);
    };

    const handleReject = async (id, note) => {
        setProcessing(true);
        setError(null);
        const result = await rejectPendingChange(id, note);
        if (result.error) {
            setError(result.error);
        } else {
            setSuccess('Change rejected.');
            window.location.reload();
        }
        setProcessing(false);
    };

    const handleDiscard = async (id) => {
        if (!confirm('Permanently delete this pending change?')) return;
        setProcessing(true);
        const result = await discardPendingChange(id);
        if (result.error) {
            setError(result.error);
        } else {
            window.location.reload();
        }
        setProcessing(false);
    };

    const handleBulkApprove = async () => {
        if (selected.length === 0) return;
        if (!confirm(`Approve ${selected.length} changes?`)) return;
        setProcessing(true);
        const result = await bulkApprovePendingChanges(selected);
        setSuccess(`Approved ${result.approved} changes.`);
        setProcessing(false);
        window.location.reload();
    };

    const handleBulkReject = async () => {
        if (selected.length === 0) return;
        setShowRejectModal(true);
    };

    const confirmBulkReject = async () => {
        setProcessing(true);
        const result = await bulkRejectPendingChanges(selected, rejectNote);
        setSuccess(`Rejected ${result.rejected} changes.`);
        setShowRejectModal(false);
        setRejectNote('');
        setProcessing(false);
        window.location.reload();
    };

    return (
        <div className="space-y-4">
            {/* Alerts */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    {error}
                    <button onClick={() => setError(null)} className="ml-4 underline text-sm">Dismiss</button>
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                    {success}
                    <button onClick={() => setSuccess(null)} className="ml-4 underline text-sm">Dismiss</button>
                </div>
            )}

            {/* Bulk Actions */}
            {isPending && changes.length > 0 && (
                <div className="flex gap-3 items-center bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border)]">
                    <button
                        onClick={toggleSelectAll}
                        className="text-sm text-[var(--muted)] hover:text-[var(--fg)] underline"
                    >
                        {selected.length === changes.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-[var(--muted)]">|</span>
                    <span className="text-sm text-[var(--muted)]">{selected.length} selected</span>
                    <div className="flex-1" />
                    <button
                        onClick={handleBulkApprove}
                        disabled={processing || selected.length === 0}
                        className="px-4 py-2 bg-green-500/20 text-green-400 font-bold rounded-lg text-sm disabled:opacity-50 hover:bg-green-500/30 transition"
                    >
                        ✓ Approve All
                    </button>
                    <button
                        onClick={handleBulkReject}
                        disabled={processing || selected.length === 0}
                        className="px-4 py-2 bg-red-500/20 text-red-400 font-bold rounded-lg text-sm disabled:opacity-50 hover:bg-red-500/30 transition"
                    >
                        ✗ Reject All
                    </button>
                </div>
            )}

            {/* List */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
                {changes.length === 0 ? (
                    <div className="p-12 text-center text-[var(--muted)]">
                        No changes found.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-black/20 text-[var(--muted)] text-xs uppercase tracking-wider">
                            <tr>
                                {isPending && <th className="p-4 w-10"></th>}
                                <th className="p-4">Type</th>
                                <th className="p-4">Movie</th>
                                <th className="p-4 hidden md:table-cell">Contributor</th>
                                <th className="p-4 hidden md:table-cell">Date</th>
                                {isPending && <th className="p-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {changes.map(change => (
                                <tr key={change._id} className="hover:bg-white/5 transition">
                                    {isPending && (
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(change._id)}
                                                onChange={() => toggleSelect(change._id)}
                                                className="w-4 h-4 accent-[var(--accent)]"
                                            />
                                        </td>
                                    )}
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeColors[change.type]}`}>
                                            {typeIcons[change.type]} {change.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <Link href={`/admin/pending/${change._id}`} className="hover:underline">
                                            <div className="font-bold text-[var(--fg)]">{change.movieData?.title || '—'}</div>
                                            <div className="text-xs text-[var(--muted)]">
                                                {change.movieData?.year || '—'} • {change.movieData?.director || 'Unknown'}
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-sm text-[var(--muted)]">
                                        @{change.contributorUsername}
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-sm text-[var(--muted)]">
                                        {change.createdAt ? new Date(change.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    {isPending && (
                                        <td className="p-4 text-right space-x-2">
                                            <Link
                                                href={`/admin/pending/${change._id}`}
                                                className="text-sm text-blue-400 hover:underline"
                                            >
                                                View
                                            </Link>
                                            <button
                                                onClick={() => handleApprove(change._id)}
                                                disabled={processing}
                                                className="text-sm text-green-400 hover:underline disabled:opacity-50"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(change._id, '')}
                                                disabled={processing}
                                                className="text-sm text-red-400 hover:underline disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border)] max-w-md w-full space-y-4">
                        <h3 className="text-lg font-bold text-[var(--fg)]">Reject {selected.length} Changes</h3>
                        <p className="text-sm text-[var(--muted)]">Add an optional note for the contributor:</p>
                        <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Reason for rejection (optional)..."
                            className="w-full p-3 rounded-lg bg-black/20 border border-[var(--border)] text-[var(--fg)] text-sm"
                            rows={3}
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 bg-white/5 rounded-lg text-[var(--muted)]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBulkReject}
                                disabled={processing}
                                className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg disabled:opacity-50"
                            >
                                Reject All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
