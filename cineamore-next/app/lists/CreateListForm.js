'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createList } from '@/lib/list-actions';

export default function CreateListForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        startTransition(async () => {
            const result = await createList(formData);

            if (result.error) {
                setError(result.error);
            } else {
                router.push(`/lists/${result.listId}`);
            }
        });
    }

    function handleClose() {
        router.push('/lists');
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <h2 className="text-xl font-bold text-[var(--fg)]">Create New List</h2>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <svg className="w-5 h-5 fill-[var(--muted)]" viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                                List Name *
                            </label>
                            <input
                                type="text"
                                name="title"
                                required
                                placeholder="e.g., Best of 2024"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--fg)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                rows={3}
                                placeholder="Optional description..."
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--fg)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] outline-none transition-colors resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                                List Type
                            </label>
                            <select
                                name="type"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--fg)] focus:border-[var(--accent)] outline-none transition-colors"
                            >
                                <option value="custom">Custom List</option>
                                <option value="watchlist">Watchlist</option>
                                <option value="favorites">Favorites</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="isPublic"
                                value="true"
                                id="isPublic"
                                className="w-5 h-5 rounded border-white/10 bg-white/5 text-[var(--accent)] focus:ring-[var(--accent)]"
                            />
                            <label htmlFor="isPublic" className="text-sm text-[var(--fg)]">
                                Make this list public
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-[var(--fg)] font-medium hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex-1 px-4 py-3 rounded-xl bg-[var(--accent)] text-black font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isPending ? 'Creating...' : 'Create List'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
