'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleListVisibility, deleteList } from '@/lib/list-actions';

export default function ListActions({ listId, isPublic }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);

    async function handleToggleVisibility() {
        startTransition(async () => {
            const result = await toggleListVisibility(listId);
            if (result.success) {
                setCurrentIsPublic(result.isPublic);
            }
        });
    }

    async function handleDelete() {
        startTransition(async () => {
            const result = await deleteList(listId);
            if (result.success) {
                router.push('/lists');
            }
        });
    }

    return (
        <div className="flex items-center gap-2">
            {/* Toggle Visibility */}
            <button
                onClick={handleToggleVisibility}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
                {currentIsPublic ? (
                    <>
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                        </svg>
                        <span className="text-sm">Make Private</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                        <span className="text-sm">Make Public</span>
                    </>
                )}
            </button>

            {/* Delete Button */}
            {!showDeleteConfirm ? (
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                    <span className="text-sm">Delete</span>
                </button>
            ) : (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 rounded-xl bg-white/5 text-[var(--fg)] text-sm hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        {isPending ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                </div>
            )}
        </div>
    );
}
