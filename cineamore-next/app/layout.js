import Header from "@/components/Header";
import UserMenu from "@/components/UserMenu";
import Footer from "@/components/Footer";
import GlobalStickySearch from "@/components/GlobalStickySearch";
import GlobalLoader from "@/components/GlobalLoader";
import InstallPrompt from "@/components/InstallPrompt";
import SWUpdater from "@/components/SWUpdater";
import LayoutAnimationWrapper from "@/components/LayoutAnimationWrapper";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: '#8B0000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata = {
  title: {
    template: '%s | CineAmore',
    default: 'CineAmore - The Ultimate Film Catalogue',
  },
  description: 'Explore thousands of movies, create lists, and track your watching habits with CineAmore.',
  keywords: ['movies', 'film', 'catalogue', 'streaming', 'cinema', 'reviews'],
  authors: [{ name: 'CineAmore Team' }],
  creator: 'CineAmore',
  publisher: 'CineAmore',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CineAmore',
  },
  openGraph: {
    title: 'CineAmore',
    description: 'The Ultimate Film Catalogue',
    url: 'https://cineamore.vercel.app',
    siteName: 'CineAmore',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CineAmore',
    description: 'The Ultimate Film Catalogue',
    creator: '@cineamore_app',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  // session check removed for performance (TTFB optimization)

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                  
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js').catch(function() {});
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        <Header
          userMenu={
            <Suspense fallback={<div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />}>
              <UserMenu />
            </Suspense>
          }
          navLinks={
            <Suspense fallback={<nav className="hidden md:flex items-center gap-6 opacity-0"><div className="h-4 w-12 bg-white/5 rounded" /></nav>}>
              <NavLinks />
            </Suspense>
          }
        />

        {/* GLOBAL STICKY SEARCH - Appears when scrolling on ALL pages */}
        {/* DO NOT REMOVE - User has requested this feature multiple times */}
        <GlobalStickySearch />
        <GlobalLoader />
        <InstallPrompt />
        <SWUpdater />

        <Analytics />
        <SpeedInsights />
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <LayoutAnimationWrapper>
              <Suspense fallback={null}>
                {children}
              </Suspense>
            </LayoutAnimationWrapper>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
