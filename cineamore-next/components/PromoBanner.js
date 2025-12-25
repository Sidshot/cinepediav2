'use client';

import { useState, useEffect } from 'react';

/**
 * Ads Notice Banner
 * - Informs users about third-party streaming integrations and potential ads
 * - "I Have Read This" - permanently dismisses (localStorage)
 * - "I'll Read Later" - dismisses for session only (sessionStorage)
 * - Only shows on homepage default view
 * - Glossy iOS style matching site aesthetic
 */
const PERMANENT_KEY = 'adsNoticeDismissedPermanent';
const SESSION_KEY = 'adsNoticeDismissedSession';

export default function PromoBanner({ showOnlyOnHome = true }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner should show
    const isPermanentlyDismissed = typeof window !== 'undefined' &&
      localStorage.getItem(PERMANENT_KEY) === 'true';

    const isSessionDismissed = typeof window !== 'undefined' &&
      sessionStorage.getItem(SESSION_KEY) === 'true';

    if (!isPermanentlyDismissed && !isSessionDismissed) {
      setIsVisible(true);
    }
  }, []);

  // Lock body scroll when banner is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isVisible]);

  const handlePermanentDismiss = () => {
    // Never show again
    localStorage.setItem(PERMANENT_KEY, 'true');
    setIsVisible(false);
  };

  const handleSessionDismiss = () => {
    // Show again next session (when tab/browser is closed and reopened)
    sessionStorage.setItem(SESSION_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="promo-banner-overlay">
      <div className="promo-banner-content">
        {/* Close Button (X) - Same as "I'll Read Later" */}
        <button
          onClick={handleSessionDismiss}
          className="promo-close-btn"
          aria-label="Close banner"
        >
          ✕
        </button>

        {/* Banner Content */}
        <div className="promo-inner">
          {/* Decorative Elements */}
          <div className="promo-glow promo-glow-1" />
          <div className="promo-glow promo-glow-2" />

          {/* Icon */}
          <div className="promo-icon">
            📺⚠️
          </div>

          {/* Title */}
          <h2 className="promo-title">
            Important Streaming Notice
          </h2>

          {/* Main Message */}
          <p className="promo-subtitle">
            CinePedia enables free movie streaming through <strong>third-party resource integrations</strong>.
            These integrations may display <strong>advertisements</strong> which are beyond our control.
          </p>

          {/* Tips Section */}
          <div className="promo-tips">
            <div className="promo-tip">
              <span className="tip-icon">🛡️</span>
              <span>We recommend using an <strong>ad-blocker extension</strong> (uBlock Origin or AdBlock Plus) for the best ad-free experience.</span>
            </div>
            <div className="promo-tip coming-soon">
              <span className="tip-icon">📖</span>
              <span>To have an ad-free experience, you must <a href="https://sidshot.github.io/adblock-guide/" target="_blank" rel="noopener noreferrer" className="adblock-link">click here</a></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="promo-actions">
            <button onClick={handlePermanentDismiss} className="promo-btn-primary">
              <span>I Have Read This</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
            <button onClick={handleSessionDismiss} className="promo-btn-secondary">
              I'll Read Later
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .promo-banner-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .promo-banner-content {
          position: relative;
          max-width: 520px;
          width: 90%;
          /* Solid dark background for maximum readability */
          background: linear-gradient(
            145deg,
            rgb(18, 18, 22) 0%,
            rgb(25, 25, 30) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-top: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 28px;
          padding: 40px 32px;
          text-align: center;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.9),
            0 0 80px rgba(0, 0, 0, 0.5),
            inset 0 0 0 1px rgba(255, 255, 255, 0.08);
          overflow: hidden;
          animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .promo-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: var(--muted);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .promo-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: var(--fg);
          transform: scale(1.1);
        }

        .promo-inner {
          position: relative;
          z-index: 2;
        }

        .promo-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          opacity: 0.15;
          pointer-events: none;
        }

        .promo-glow-1 {
          width: 200px;
          height: 200px;
          background: #f59e0b; /* Amber warning color */
          top: -80px;
          left: -60px;
        }

        .promo-glow-2 {
          width: 180px;
          height: 180px;
          background: #ef4444; /* Red accent */
          bottom: -60px;
          right: -40px;
        }

        .promo-icon {
          font-size: 48px;
          margin-bottom: 16px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .promo-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--fg);
          margin: 0 0 16px 0;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, var(--fg) 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .promo-subtitle {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 24px 0;
          line-height: 1.7;
        }

        .promo-subtitle strong {
          color: var(--fg);
        }

        .promo-tips {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 28px;
          text-align: left;
        }

        .promo-tip {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
        }

        .adblock-link {
          color: #f59e0b;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: all 0.2s ease;
        }

        .adblock-link:hover {
          color: #fbbf24;
          text-decoration-thickness: 2px;
        }

        .promo-tip.coming-soon {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.25);
        }

        .promo-tip strong {
          color: var(--fg);
        }

        .tip-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .promo-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .promo-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #000;
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 
            0 8px 24px rgba(245, 158, 11, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .promo-btn-primary:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 
            0 12px 32px rgba(245, 158, 11, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .promo-btn-primary svg {
          transition: transform 0.2s ease;
        }

        .promo-btn-primary:hover svg {
          transform: scale(1.1);
        }

        .promo-btn-secondary {
          display: block;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--muted);
          font-size: 0.9rem;
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .promo-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          color: var(--fg);
        }

        @media (max-width: 480px) {
          .promo-banner-content {
            padding: 32px 24px;
            margin: 16px;
          }

          .promo-title {
            font-size: 1.4rem;
          }

          .promo-subtitle {
            font-size: 0.9rem;
          }

          .promo-tip {
            font-size: 0.82rem;
            padding: 10px 12px;
          }

          .promo-btn-primary {
            padding: 12px 24px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
