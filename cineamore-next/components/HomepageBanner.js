'use client';

import { useState, useEffect } from 'react';

/**
 * Homepage Support Banner
 * - Asks users to support CineAmore via BuyMeACoffee
 * - Shows Twitter and Telegram links for updates
 * - 5 second countdown before X button appears
 * - 10 second countdown before Access button appears
 * - Shows once per browser session (uses sessionStorage)
 * - Does NOT show on page reload (only on fresh session)
 * - Glossy iOS style matching site aesthetic
 */
const STORAGE_KEY = 'supportBanner_dismissed';

export default function HomepageBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [showAccessButton, setShowAccessButton] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Check if banner should show (session-based logic)
  // Uses sessionStorage: shows once per browser session (closes when browser/tab closes)
  // Does NOT show on page reload within same session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already dismissed in this session
    const dismissedInSession = sessionStorage.getItem(STORAGE_KEY);
    if (dismissedInSession === 'true') {
      setIsVisible(false);
      return;
    }

    // Show banner for this session
    setIsVisible(true);
  }, []);

  // Countdown timer: 5s for X button, 10s for Access button
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowAccessButton(true);
          return 0;
        }
        // Show close button after 5 seconds (when countdown reaches 5)
        if (prev === 6) {
          setShowCloseButton(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

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

  const handleDismiss = () => {
    // Mark as dismissed for this session only
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="banner-overlay">
      <div className="banner-content">
        {/* Close Button (appears after 5 seconds) */}
        {showCloseButton && (
          <button onClick={handleDismiss} className="banner-close-btn" aria-label="Close">
            ×
          </button>
        )}

        {/* Banner Inner Content */}
        <div className="banner-inner">
          {/* Decorative Glows */}
          <div className="banner-glow banner-glow-1" />
          <div className="banner-glow banner-glow-2" />

          {/* Icon */}
          <div className="banner-icon">
            ☕💛
          </div>

          {/* Title */}
          <h2 className="banner-title">
            Help Keep CineAmore Running
          </h2>

          {/* Main Message */}
          <p className="banner-subtitle">
            So far, CineAmore has been a <strong>hobby project</strong> run by a single person,
            with all costs covered out of pocket. As the site grows, it's becoming harder to
            keep up with <strong>rising expenses</strong>.
          </p>
          <p className="banner-subtitle appeal-text">
            If you're a <strong className="highlight">cinephile who downloads films</strong> from here,
            please consider <strong className="highlight">buying me a coffee</strong> to keep this alive!
          </p>

          {/* Buy Me A Coffee Button */}
          <a
            href="https://buymeacoffee.com/cineamore"
            target="_blank"
            rel="noopener noreferrer"
            className="bmc-button"
          >
            <span className="bmc-icon">☕</span>
            <span>Buy me a coffee</span>
          </a>

          {/* Social Links Section */}
          <div className="banner-tips">
            <div className="banner-tip social-tip">
              <span className="tip-icon">📢</span>
              <span>
                Follow on{' '}
                <a
                  href="https://x.com/__Sithlord__"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="twitter-link"
                >
                  Twitter
                </a>
                {' '}for updates!
              </span>
            </div>
            <div className="banner-tip social-tip telegram-tip">
              <span className="tip-icon">💬</span>
              <span>
                Join our{' '}
                <a
                  href="https://t.me/cineamore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="telegram-link"
                >
                  Telegram Group
                </a>
                {' '}for instant access to admin!
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="banner-actions">
            {showAccessButton ? (
              <button onClick={handleDismiss} className="banner-btn-primary">
                <span>Access CineAmore</span>
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
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <p className="countdown-text">
                {showCloseButton
                  ? `Please read... ${countdown}s to continue`
                  : `Please read... ${countdown}s remaining`
                }
              </p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .banner-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .banner-content {
          position: relative;
          max-width: 520px;
          width: 90%;
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

        .banner-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: var(--muted, #888);
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          animation: fadeIn 0.3s ease-out;
        }

        .banner-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: var(--fg, #fff);
          transform: scale(1.1);
        }

        .banner-inner {
          position: relative;
          z-index: 2;
        }

        .banner-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          opacity: 0.2;
          pointer-events: none;
        }

        .banner-glow-1 {
          width: 200px;
          height: 200px;
          background: #FF813F; /* BMC Orange */
          top: -80px;
          left: -60px;
        }

        .banner-glow-2 {
          width: 180px;
          height: 180px;
          background: #FFDD00; /* BMC Yellow */
          bottom: -60px;
          right: -40px;
        }

        .banner-icon {
          font-size: 48px;
          margin-bottom: 16px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        .banner-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--fg, #fff);
          margin: 0 0 16px 0;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #fff 0%, #FF813F 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .banner-subtitle {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 16px 0;
          line-height: 1.7;
        }

        .banner-subtitle.appeal-text {
          margin-bottom: 24px;
        }

        .banner-subtitle strong {
          color: var(--fg, #fff);
        }

        .highlight {
          color: #FFDD00 !important;
          text-shadow: 0 0 12px rgba(255, 221, 0, 0.4);
        }

        .bmc-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #FFDD00 0%, #FF813F 100%);
          color: #000;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          border-radius: 99px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 
            0 8px 24px rgba(255, 129, 63, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          margin-bottom: 24px;
        }

        .bmc-button:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 
            0 12px 32px rgba(255, 129, 63, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .bmc-icon {
          font-size: 1.2rem;
        }

        .banner-tips {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 28px;
          text-align: left;
        }

        .banner-tip {
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

        .twitter-link {
          color: #1d9bf0;
          font-weight: 700;
          text-decoration: none;
          background: rgba(29, 155, 240, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .twitter-link:hover {
          background: rgba(29, 155, 240, 0.3);
          text-decoration: underline;
        }

        .telegram-link {
          color: #0088cc;
          font-weight: 700;
          text-decoration: none;
          background: rgba(0, 136, 204, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .telegram-link:hover {
          background: rgba(0, 136, 204, 0.3);
          text-decoration: underline;
        }

        .banner-tip.social-tip {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .banner-tip.telegram-tip {
          background: rgba(0, 136, 204, 0.08);
          border-color: rgba(0, 136, 204, 0.2);
        }

        .tip-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .banner-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .countdown-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          font-style: italic;
          padding: 14px 0;
          animation: countdownPulse 1.5s ease-in-out infinite;
        }

        @keyframes countdownPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .banner-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #FF813F 0%, #d97706 100%);
          color: #000;
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 
            0 8px 24px rgba(255, 129, 63, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .banner-btn-primary:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 
            0 12px 32px rgba(255, 129, 63, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .banner-btn-primary svg {
          transition: transform 0.2s ease;
        }

        .banner-btn-primary:hover svg {
          transform: translateX(4px);
        }

        @media (max-width: 480px) {
          .banner-content {
            padding: 32px 24px;
            margin: 16px;
          }

          .banner-title {
            font-size: 1.4rem;
          }

          .banner-subtitle {
            font-size: 0.9rem;
          }

          .banner-tip {
            font-size: 0.82rem;
            padding: 10px 12px;
          }

          .bmc-button,
          .banner-btn-primary {
            padding: 12px 24px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
