'use client';

import { useState, useEffect, useTransition } from 'react';
import { quickAddToList, getUserLists, addMovieToList, getListsContainingMovie } from '@/lib/list-actions';

/**
 * AddToListButton - A dropdown button for adding movies to user lists
 * Shows quick-add options for Watchlist/Favorites and user's custom lists
 */
export default function AddToListButton({ movieId, movieTitle, variant = 'icon' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [lists, setLists] = useState([]);
    const [inLists, setInLists] = useState([]);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Fetch user's lists when dropdown opens
    useEffect(() => {
        if (isOpen) {
            loadLists();
        }
    }, [isOpen]);

    async function loadLists() {
        try {
            const [userLists, containingLists] = await Promise.all([
                getUserLists(),
                getListsContainingMovie(movieId)
            ]);
            setLists(userLists);
            setInLists(containingLists.map(l => l._id));
            setIsLoggedIn(true);
        } catch (error) {
            // User not logged in
            setIsLoggedIn(false);
        }
    }

    async function handleQuickAdd(type) {
        startTransition(async () => {
            const result = await quickAddToList(movieId, type);
            if (result.success) {
                setMessage(`Added to ${result.listTitle}!`);
                loadLists(); // Refresh
            } else if (result.alreadyAdded) {
                setMessage('Already in list');
            } else {
                setMessage(result.error || 'Failed');
            }
            setTimeout(() => setMessage(null), 2000);
        });
    }

    async function handleAddToList(listId) {
        startTransition(async () => {
            const result = await addMovieToList(listId, movieId);
            if (result.success) {
                setMessage('Added!');
                loadLists();
            } else {
                setMessage(result.error || 'Failed');
            }
            setTimeout(() => setMessage(null), 2000);
        });
    }

    const isInWatchlist = inLists.some(id => lists.find(l => l._id === id && l.type === 'watchlist'));
    const isInFavorites = inLists.some(id => lists.find(l => l._id === id && l.type === 'favorites'));

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`flex items-center justify-center gap-1 transition-all ${variant === 'icon'
                        ? 'p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm'
                        : 'px-4 py-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 text-xs font-bold'
                    }`}
                title="Add to list"
            >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
                {variant !== 'icon' && <span>Save</span>}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                            <p className="text-xs text-[var(--muted)] truncate">
                                Save "{movieTitle}"
                            </p>
                        </div>

                        {!isLoggedIn ? (
                            <div className="p-4 text-center">
                                <p className="text-sm text-[var(--muted)] mb-3">Sign in to save movies</p>
                                <a
                                    href="/api/auth/signin"
                                    className="inline-block px-4 py-2 bg-[var(--accent)] text-black rounded-lg text-sm font-bold"
                                >
                                    Sign In
                                </a>
                            </div>
                        ) : (
                            <>
                                {/* Quick Add Buttons */}
                                <div className="p-2 space-y-1">
                                    <button
                                        onClick={() => handleQuickAdd('watchlist')}
                                        disabled={isPending || isInWatchlist}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isInWatchlist
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                        </svg>
                                        <span>Watchlist</span>
                                        {isInWatchlist && <span className="ml-auto text-xs">✓</span>}
                                    </button>

                                    <button
                                        onClick={() => handleQuickAdd('favorites')}
                                        disabled={isPending || isInFavorites}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isInFavorites
                                                ? 'bg-red-500/10 text-red-400'
                                                : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                        <span>Favorites</span>
                                        {isInFavorites && <span className="ml-auto text-xs">✓</span>}
                                    </button>
                                </div>

                                {/* Divider */}
                                {lists.filter(l => l.type === 'custom').length > 0 && (
                                    <div className="border-t border-white/5 mx-2" />
                                )}

                                {/* Custom Lists */}
                                <div className="p-2 max-h-40 overflow-y-auto">
                                    {lists.filter(l => l.type === 'custom').map(list => {
                                        const isInList = inLists.includes(list._id);
                                        return (
                                            <button
                                                key={list._id}
                                                onClick={() => handleAddToList(list._id)}
                                                disabled={isPending || isInList}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isInList
                                                        ? 'bg-blue-500/10 text-blue-400'
                                                        : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                                </svg>
                                                <span className="truncate">{list.title}</span>
                                                {isInList && <span className="ml-auto text-xs">✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Create New List Link */}
                                <div className="border-t border-white/5 p-2">
                                    <a
                                        href="/lists?new=true"
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5 text-[var(--accent)]"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                        </svg>
                                        <span>Create New List</span>
                                    </a>
                                </div>
                            </>
                        )}

                        {/* Message Toast */}
                        {message && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 px-4 py-2 bg-black/90 text-center text-sm rounded-lg">
                                {message}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
