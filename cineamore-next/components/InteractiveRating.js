'use client';

import { useState } from 'react';

export default function InteractiveRating({ movieId, initialSum, initialCount }) {
    const [rating, setRating] = useState(0); // User's current hover/selection
    const [hasRated, setHasRated] = useState(false);

    // Calculate display values
    const [currentSum, setCurrentSum] = useState(initialSum || 0);
    const [currentCount, setCurrentCount] = useState(initialCount || 0);

    const average = currentCount > 0 ? (currentSum / currentCount).toFixed(1) : '0.0';

    const handleRate = async (score) => {
        if (hasRated) return;

        // Optimistic UI update
        // We don't update average immediately to avoid jumpiness, looking for animation
        setRating(score);
        setHasRated(true);

        try {
            const res = await fetch('/api/rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movieId, rating: score })
            });
            const data = await res.json();

            if (data.success) {
                setCurrentSum(prev => prev + score);
                setCurrentCount(data.newCount); // Use server count to be accurate
            }
        } catch (e) {
            console.error(e);
            setHasRated(false); // Revert if failed
        }
    };

    return (
        <div className="flex flex-col items-center gap-2 glossy-box px-6 py-4">
            <div className="text-sm font-bold uppercase tracking-widest text-[var(--muted)]">Rate This Film</div>

            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => handleRate(star)}
                        onMouseEnter={() => !hasRated && setRating(star)}
                        onMouseLeave={() => !hasRated && setRating(0)}
                        className="focus:outline-none transition-transform hover:scale-125"
                        disabled={hasRated}
                    >
                        <svg
                            className={`w-8 h-8 transition-colors duration-200 ${star <= rating || (hasRated && star <= rating)
                                    ? 'fill-[var(--accent)] drop-shadow-[0_0_10px_var(--accent)]'
                                    : 'fill-[var(--muted)] opacity-30'
                                }`}
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    </button>
                ))}
            </div>

            <div className="text-xs text-[var(--muted)] mt-1">
                {hasRated ? (
                    <span className="text-[var(--accent)] font-bold">Thanks for rating!</span>
                ) : (
                    <span>Avg: <strong className="text-[var(--fg)]">{average}</strong> ({currentCount})</span>
                )}
            </div>
        </div>
    );
}
