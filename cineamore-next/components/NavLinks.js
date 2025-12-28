import Link from 'next/link';
import { auth } from '@/lib/auth-next';

export default async function NavLinks() {
    let session = null;
    try {
        session = await auth();
    } catch (e) {
        // Build time safety: If auth fails (missing secrets), assume logged out
    }
    const isLoggedIn = !!session?.user;

    return (
        <nav className="hidden md:flex items-center gap-6">
            <Link
                href="/"
                className="text-sm font-medium text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
            >
                Browse
            </Link>
            {isLoggedIn && (
                <Link
                    href="/lists"
                    className="text-sm font-medium text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
                >
                    My Lists
                </Link>
            )}
        </nav>
    );
}
