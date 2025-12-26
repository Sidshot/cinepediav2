'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LayoutAnimationWrapper({ children }) {
    const pathname = usePathname();
    const [isIOSSafari, setIsIOSSafari] = useState(false);

    useEffect(() => {
        // Detect iOS Safari/WebKit to prevent navigation loops
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isWebKit = /WebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        setIsIOSSafari(isIOS || isWebKit);
    }, []);

    // Skip animations on iOS Safari to prevent navigation loops
    if (isIOSSafari) {
        return <div key={pathname}>{children}</div>;
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                    duration: 0.2,
                    ease: 'easeInOut'
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
