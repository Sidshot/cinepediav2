'use client';

import { useTransition } from 'react';

export default function DeleteButton({ id, deleteAction }) {
    const [isPending, startTransition] = useTransition();

    const handleClick = (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to delete this movie? This cannot be undone.')) {
            startTransition(() => {
                deleteAction(id);
            });
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className="text-sm font-bold text-red-500 hover:text-red-400 opacity-60 hover:opacity-100 transition disabled:opacity-30"
        >
            {isPending ? 'Deleting...' : 'Delete'}
        </button>
    );
}
