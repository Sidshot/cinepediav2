import Header from "@/components/Header";
import UserMenu from "@/components/UserMenu";
import Footer from "@/components/Footer";
import GlobalStickySearch from "@/components/GlobalStickySearch";
import LayoutAnimationWrapper from "@/components/LayoutAnimationWrapper";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/lib/auth-next";
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
  },
};

export default async function RootLayout({ children }) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

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
                } catch (e) {}
              })();
            `,
          }}
        />

        <Header userMenu={<UserMenu />} isLoggedIn={isLoggedIn} />

        {/* GLOBAL STICKY SEARCH - Appears when scrolling on ALL pages */}
        {/* DO NOT REMOVE - User has requested this feature multiple times */}
        <GlobalStickySearch />

        <Analytics />
        <SpeedInsights />
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <LayoutAnimationWrapper>
              {children}
            </LayoutAnimationWrapper>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
