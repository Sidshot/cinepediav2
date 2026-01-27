'use client';

/**
 * BuyMeACoffee Floating Widget
 * - High visibility dark glass (90% opacity)
 * - Reliable Native <a> tag for clicking
 * - Z-Index 9999 to ensure it catches all clicks
 */
export default function BuyMeCoffeeWidget() {
    return (
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a
            href="https://buymeacoffee.com/cineamore"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy me a coffee"
            title="Support CineAmore"
            className="bmc-high-vis-fab"
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/bmc-logo.png"
                alt="Buy Me a Coffee"
                className="bmc-logo-img"
            />

            <style jsx global>{`
                .bmc-high-vis-fab {
                    position: fixed;
                    bottom: 104px;
                    right: 24px;
                    z-index: 9999 !important; /* Force top layer */
                    
                    /* Square with rounded corners */
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    
                    /* High Visibility Dark Glass (90% Opacity) */
                    background: rgba(10, 10, 10, 0.9);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    
                    /* Distinct border */
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    
                    /* Strong Shadow */
                    box-shadow: 
                        0 4px 20px rgba(0, 0, 0, 0.6),
                        0 2px 8px rgba(0, 0, 0, 0.4);
                    
                    cursor: pointer;
                    text-decoration: none;
                    pointer-events: auto; /* Ensure clickable */
                    
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    
                    transition: all 0.2s ease-out;
                }

                .bmc-high-vis-fab:hover {
                    transform: translateY(-2px) scale(1.05);
                    background: rgba(20, 20, 20, 1.0); /* Solid on hover */
                    border-color: rgba(255, 200, 100, 0.4); /* Gold glow border */
                    box-shadow: 
                        0 8px 25px rgba(0, 0, 0, 0.7),
                        0 0 15px rgba(255, 200, 100, 0.2);
                }

                .bmc-high-vis-fab:active {
                    transform: translateY(0) scale(0.96);
                }

                .bmc-logo-img {
                    width: 28px;
                    height: 28px;
                    object-fit: contain;
                    pointer-events: none; /* Let clicks pass to <a> */
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                }

                /* Responsive */
                @media (max-width: 640px) {
                    .bmc-high-vis-fab {
                        width: 48px;
                        height: 48px;
                        bottom: 94px;
                        right: 16px;
                    }
                    
                    .bmc-logo-img {
                        width: 24px;
                        height: 24px;
                    }
                }
            `}</style>
        </a>
    );
}
