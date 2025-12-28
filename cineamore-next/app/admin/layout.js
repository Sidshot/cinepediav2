import { isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
    // SECURITY GATE: Protects all /admin routes
    const hasAccess = await isAdmin();

    if (!hasAccess) {
        redirect('/login');
    }

    return (
        <div className="admin-layout">
            {children}
        </div>
    );
}
