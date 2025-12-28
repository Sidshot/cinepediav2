'use client';

import { useEffect, useState } from 'react';

/**
 * PWA Install Prompt Component
 * Shows a stylish install button when the browser supports PWA installation
 */
export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed recently (24 hours)
        const dismissed = localStorage.getItem('pwa_prompt_dismissed');
        if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) {
            return;
        }

        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Save the event for later
            setDeferredPrompt(e);
            // Show our custom prompt after a delay
            setTimeout(() => setShowPrompt(true), 3000);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    };

    if (isInstalled || !showPrompt || !deferredPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🎬</span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-sm">Install CineAmore</h3>
                        <p className="text-white/50 text-xs">Add to home screen for the best experience</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={handleDismiss}
                            className="px-3 py-1.5 text-white/50 text-xs hover:text-white transition-colors"
                        >
                            Later
                        </button>
                        <button
                            onClick={handleInstall}
                            className="px-4 py-1.5 bg-[var(--accent)] text-black font-bold text-xs rounded-full hover:opacity-90 transition-opacity"
                        >
                            Install
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
