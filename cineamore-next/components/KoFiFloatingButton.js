'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import KoFiButton from '@/components/KoFiButton';

export default function KoFiFloatingButton() {
    const pathname = usePathname();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const hideOnGate =
        pathname === '/login' &&
        typeof window !== 'undefined' &&
        window.location.search.includes('gate=true');

    useEffect(() => {
        const updateFullscreen = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        updateFullscreen();
        document.addEventListener('fullscreenchange', updateFullscreen);

        return () => {
            document.removeEventListener('fullscreenchange', updateFullscreen);
        };
    }, []);

    if (isFullscreen || hideOnGate) {
        return null;
    }

    return (
        <div className="fixed right-3 top-20 z-[70] md:right-4 md:top-24">
            <KoFiButton />
        </div>
    );
}
