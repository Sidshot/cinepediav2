'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approvePendingChange, rejectPendingChange, discardPendingChange } from '@/lib/adminApprovalActions';

export default function PendingDetail({ change }) {
    const router = useRouter();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [rejectNote, setRejectNote] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    const handleApprove = async () => {
        if (!confirm('Approve this change and apply it to the database?')) return;
        setProcessing(true);
        setError(null);
        const result = await approvePendingChange(change._id);
        if (result.error) {
            setError(result.error);
            setProcessing(false);
        } else {
            router.push('/admin/pending');
        }
    };

    const handleReject = async () => {
        setProcessing(true);
        setError(null);
        const result = await rejectPendingChange(change._id, rejectNote);
        if (result.error) {
            setError(result.error);
            setProcessing(false);
        } else {
            router.push('/admin/pending');
        }
    };

    const handleDiscard = async () => {
        if (!confirm('Permanently delete this pending change? This cannot be undone.')) return;
        setProcessing(true);
        const result = await discardPendingChange(change._id);
        if (result.error) {
            setError(result.error);
            setProcessing(false);
        } else {
            router.push('/admin/pending');
        }
    };

    // Helper to render a field comparison
    const FieldDiff = ({ label, oldVal, newVal }) => {
        const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
        const oldStr = Array.isArray(oldVal) ? oldVal.join(', ') : (oldVal?.toString() || '—');
        const newStr = Array.isArray(newVal) ? newVal.join(', ') : (newVal?.toString() || '—');

        return (
            <div className="border-b border-[var(--border)] py-3">
                <div className="text-xs uppercase text-[var(--muted)] font-bold mb-1">{label}</div>
                {change.type === 'update' && change.previousData ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-2 rounded-lg ${changed ? 'bg-red-500/10' : 'bg-white/5'}`}>
                            <span className="text-xs text-[var(--muted)] block mb-1">Before</span>
                            <span className={changed ? 'text-red-400' : 'text-[var(--fg)]'}>{oldStr}</span>
                        </div>
                        <div className={`p-2 rounded-lg ${changed ? 'bg-green-500/10' : 'bg-white/5'}`}>
                            <span className="text-xs text-[var(--muted)] block mb-1">After</span>
                            <span className={changed ? 'text-green-400' : 'text-[var(--fg)]'}>{newStr}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-[var(--fg)]">{newStr}</div>
                )}
            </div>
        );
    };

    const isPending = change.status === 'pending';

    return (
        <div className="space-y-6">
            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    {error}
                </div>
            )}

            {/* Review Note (if rejected) */}
            {change.status === 'rejected' && change.reviewNotes && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="text-xs uppercase text-red-400 font-bold mb-1">Rejection Note</div>
                    <div className="text-red-300">{change.reviewNotes}</div>
                </div>
            )}

            {/* Actions */}
            {isPending && (
                <div className="flex gap-3 flex-wrap bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border)]">
                    <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:brightness-110 disabled:opacity-50 transition"
                    >
                        ✓ Approve & Apply
                    </button>
                    <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={processing}
                        className="px-6 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl hover:bg-red-500/30 disabled:opacity-50 transition"
                    >
                        ✗ Reject
                    </button>
                    <button
                        onClick={handleDiscard}
                        disabled={processing}
                        className="px-6 py-3 bg-white/5 text-[var(--muted)] font-bold rounded-xl hover:bg-white/10 disabled:opacity-50 transition"
                    >
                        🗑️ Discard
                    </button>
                </div>
            )}

            {/* Content Card */}
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-6">
                <h2 className="text-lg font-bold text-[var(--fg)] mb-4">
                    {change.type === 'create' && 'Proposed New Movie'}
                    {change.type === 'update' && 'Proposed Changes'}
                    {change.type === 'delete' && 'Movie to Delete'}
                </h2>

                <div className="space-y-0">
                    <FieldDiff label="Title" oldVal={change.previousData?.title} newVal={change.movieData?.title} />
                    <FieldDiff label="Year" oldVal={change.previousData?.year} newVal={change.movieData?.year} />
                    <FieldDiff label="Director" oldVal={change.previousData?.director} newVal={change.movieData?.director} />
                    <FieldDiff label="Original Title" oldVal={change.previousData?.original} newVal={change.movieData?.original} />
                    <FieldDiff label="Genres" oldVal={change.previousData?.genre} newVal={change.movieData?.genre} />
                    <FieldDiff label="Plot" oldVal={change.previousData?.plot} newVal={change.movieData?.plot} />
                    <FieldDiff label="Poster" oldVal={change.previousData?.poster} newVal={change.movieData?.poster} />
                    <FieldDiff label="Letterboxd" oldVal={change.previousData?.lb} newVal={change.movieData?.lb} />
                    <FieldDiff label="Notes" oldVal={change.previousData?.notes} newVal={change.movieData?.notes} />

                    {/* Download Links */}
                    <div className="border-b border-[var(--border)] py-3">
                        <div className="text-xs uppercase text-[var(--muted)] font-bold mb-1">Download Links</div>
                        <div className="space-y-1">
                            {change.movieData?.downloadLinks?.length > 0 ? (
                                change.movieData.downloadLinks.map((link, i) => (
                                    <div key={i} className="text-sm">
                                        <span className="text-[var(--fg)]">{link.label}</span>
                                        <span className="text-[var(--muted)] mx-2">→</span>
                                        <span className="text-blue-400 truncate">{link.url}</span>
                                    </div>
                                ))
                            ) : (
                                <span className="text-[var(--muted)]">No download links</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border)] max-w-md w-full space-y-4">
                        <h3 className="text-lg font-bold text-[var(--fg)]">Reject Change</h3>
                        <p className="text-sm text-[var(--muted)]">Add a note for the contributor (optional):</p>
                        <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Reason for rejection..."
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
                                onClick={handleReject}
                                disabled={processing}
                                className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
