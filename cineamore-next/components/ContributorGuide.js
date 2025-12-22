'use client';

import { useState } from 'react';
import { markGuideAsSeen } from '@/lib/guideActions';

/**
 * Contributor Onboarding Guide
 * Shows comprehensive FAQ and tooltips on first login
 */
export default function ContributorGuide({ onDismiss }) {
    const [loading, setLoading] = useState(false);

    const handleGotIt = async () => {
        setLoading(true);
        await markGuideAsSeen();
        if (onDismiss) onDismiss();
        window.location.reload();
    };

    return (
        <div className="bg-gradient-to-br from-[var(--accent)]/10 via-[var(--card-bg)] to-purple-500/10 rounded-2xl border border-[var(--accent)]/30 p-6 mb-8 backdrop-blur-md shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">📚</span>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--fg)]">Welcome, Contributor!</h2>
                        <p className="text-sm text-[var(--muted)]">Here's everything you need to know</p>
                    </div>
                </div>
            </div>

            {/* FAQ Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* How to Add Movies */}
                <div className="bg-black/20 rounded-xl p-4 border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">➕</span>
                        <h3 className="font-bold text-[var(--fg)]">Adding a Movie</h3>
                    </div>
                    <ul className="text-sm text-[var(--muted)] space-y-2">
                        <li>• Click <strong className="text-[var(--accent)]">"+ Add Movie"</strong> button</li>
                        <li>• Fill in the movie details (title, year, director)</li>
                        <li>• Use <strong>Search TMDB</strong> to auto-fill info and poster</li>
                        <li>• Add download links if available</li>
                        <li>• Submit for admin approval</li>
                    </ul>
                </div>

                {/* How to Edit Movies */}
                <div className="bg-black/20 rounded-xl p-4 border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">✏️</span>
                        <h3 className="font-bold text-[var(--fg)]">Editing a Movie</h3>
                    </div>
                    <ul className="text-sm text-[var(--muted)] space-y-2">
                        <li>• Go to the <strong className="text-blue-400">movie's page</strong> on the site</li>
                        <li>• Click <strong>Edit</strong> in the download section</li>
                        <li>• Make your changes</li>
                        <li>• Your edit will be reviewed before applying</li>
                    </ul>
                </div>

                {/* What Happens Next */}
                <div className="bg-black/20 rounded-xl p-4 border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">⏳</span>
                        <h3 className="font-bold text-[var(--fg)]">What Happens Next?</h3>
                    </div>
                    <ul className="text-sm text-[var(--muted)] space-y-2">
                        <li>• Your submission goes into <strong className="text-orange-400">Pending</strong> status</li>
                        <li>• An admin will review your submission</li>
                        <li>• If approved → appears on the site ✅</li>
                        <li>• If rejected → you'll see the reason in <strong className="text-red-400">Rejected</strong> tab</li>
                    </ul>
                </div>

                {/* Status Guide */}
                <div className="bg-black/20 rounded-xl p-4 border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">🏷️</span>
                        <h3 className="font-bold text-[var(--fg)]">Understanding Statuses</h3>
                    </div>
                    <div className="text-sm space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400">PENDING</span>
                            <span className="text-[var(--muted)]">Awaiting review</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400">APPROVED</span>
                            <span className="text-[var(--muted)]">Live on site</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400">REJECTED</span>
                            <span className="text-[var(--muted)]">Not accepted (see notes)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tips Section */}
            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20 mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💡</span>
                    <h3 className="font-bold text-purple-300">Pro Tips</h3>
                </div>
                <ul className="text-sm text-[var(--muted)] grid md:grid-cols-2 gap-2">
                    <li>• Use TMDB search for accurate metadata</li>
                    <li>• Double-check the release year</li>
                    <li>• Add director's name correctly spelled</li>
                    <li>• Include a poster URL for best display</li>
                </ul>
            </div>

            {/* Dismiss Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleGotIt}
                    disabled={loading}
                    className="px-8 py-3 bg-[var(--accent)] hover:brightness-110 text-[var(--bg)] font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
                >
                    {loading ? 'Saving...' : '✓ Got it, let me contribute!'}
                </button>
            </div>
        </div>
    );
}
