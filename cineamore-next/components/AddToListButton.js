'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import Link from 'next/link';
import { checkAuthStatus, quickAddToList, getUserLists, addMovieToList, getListsContainingMovie } from '@/lib/list-actions';

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
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            // Use mousedown to catch clicks before they propagate
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Fetch user's lists when dropdown opens
    useEffect(() => {
        if (isOpen) {
            loadLists();
        }
    }, [isOpen]);

    async function loadLists() {
        try {
            // First check auth status
            const authStatus = await checkAuthStatus();
            console.log('[AddToListButton] Auth status:', authStatus);

            if (!authStatus.isLoggedIn) {
                setIsLoggedIn(false);
                return;
            }

            setIsLoggedIn(true);

            // Now fetch lists
            const [userLists, containingLists] = await Promise.all([
                getUserLists(),
                getListsContainingMovie(movieId)
            ]);

            console.log('[AddToListButton] Lists loaded:', userLists?.length || 0);
            setLists(Array.isArray(userLists) ? userLists : []);
            setInLists(Array.isArray(containingLists) ? containingLists.map(l => l._id) : []);
        } catch (error) {
            console.error('[AddToListButton] Error loading lists:', error);
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

    // Button style variants
    const getButtonStyles = () => {
        switch (variant) {
            case 'prominent':
                // iOS-style frosted glassmorphism - subtle, elegant, always visible
                return `p-3 rounded-xl 
                    bg-gradient-to-br from-white/20 via-purple-400/30 to-pink-400/25 
                    backdrop-blur-2xl border border-white/40 
                    shadow-[0_4px_24px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(255,255,255,0.1)] 
                    hover:shadow-[0_8px_32px_rgba(168,85,247,0.25),inset_0_1px_0_rgba(255,255,255,0.6)] 
                    hover:bg-white/30 hover:scale-105 active:scale-95 
                    text-white`;
            case 'full':
                // Full button for movie detail page - more subtle
                return `px-5 py-2.5 rounded-xl 
                    bg-gradient-to-r from-white/15 via-purple-400/25 to-pink-400/20 
                    backdrop-blur-2xl border border-white/30 
                    shadow-[0_4px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] 
                    hover:shadow-[0_6px_28px_rgba(168,85,247,0.2)] 
                    hover:bg-white/25 hover:brightness-110 active:scale-95 
                    text-white font-semibold text-sm`;
            case 'icon':
            default:
                return 'p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`flex items-center justify-center gap-2 transition-all duration-300 ${getButtonStyles()}`}
                title="Add to list"
            >
                <svg className={`fill-current ${variant === 'prominent' ? 'w-5 h-5' : variant === 'full' ? 'w-5 h-5' : 'w-5 h-5'}`} viewBox="0 0 24 24">
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
                {(variant === 'full') && <span>Save to List</span>}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-xl bg-[var(--bg)] border border-[var(--border)] shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                        <p className="text-xs text-[var(--muted)] truncate">
                            Save "{movieTitle}"
                        </p>
                    </div>

                    {!isLoggedIn ? (
                        <div className="p-4 text-center">
                            <p className="text-sm text-[var(--muted)] mb-3">Sign in to save movies</p>
                            <Link
                                href="/api/auth/signin/google"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign in with Google
                            </Link>
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
                                <Link
                                    href="/lists?new=true"
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5 text-[var(--accent)]"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                    </svg>
                                    <span>Create New List</span>
                                </Link>
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
            )}
        </div>
    );
}

