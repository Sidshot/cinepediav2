export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-4 pointer-events-none">
                {/* Minimal spinner */}
                <div className="w-6 h-6 border border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>

                {/* Cinephile phrase */}
                <div className="text-white/60 text-[10px] font-mono tracking-[0.4em] uppercase">
                    CURATING
                </div>
            </div>
        </div>
    );
}
