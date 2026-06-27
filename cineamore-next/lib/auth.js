import { encrypt, decrypt } from './edge/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Contributor from '@/models/Contributor';
import bcrypt from 'bcryptjs';

function getAdminPassword() {
    if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
    if (process.env.NODE_ENV === 'production') return null;
    return 'admin123';
}

export { encrypt, decrypt };

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    return await decrypt(session);
}

/**
 * Login function - supports both admin and contributor login
 */
export async function login(formData) {
    'use server';

    const username = formData.get('username')?.trim();
    const password = formData.get('password');

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

    // ADMIN LOGIN: No username, just password
    const adminPassword = getAdminPassword();
    if (!username && adminPassword && password === adminPassword) {
        const session = await encrypt({
            user: 'admin',
            role: 'admin',
            expires
        });

        const cookieStore = await cookies();
        cookieStore.set('session', session, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });

        redirect('/admin');
    }

    // CONTRIBUTOR LOGIN: Username + Password
    if (username && password) {
        try {
            await dbConnect();

            const cleanUsername = username.toLowerCase().replace(/^@/, '');

            const contributor = await Contributor.findOne({
                username: cleanUsername,
                isActive: true
            }).lean();

            if (contributor) {
                const match = await bcrypt.compare(password, contributor.password);
                if (match) {
                    const session = await encrypt({
                        user: contributor.username,
                        role: 'contributor',
                        contributorId: contributor._id.toString(),
                        displayName: contributor.displayName || contributor.username,
                        expires
                    });

                    const cookieStore = await cookies();
                    cookieStore.set('session', session, {
                        expires,
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/'
                    });

                    redirect('/contributor');
                }
            }
        } catch (error) {
            console.error('[Auth] Contributor login error:', error);
        }
    }

    // Invalid credentials
    redirect('/login?error=Invalid Credentials');
}

export async function logout() {
    'use server';
    const cookieStore = await cookies();
    cookieStore.set('session', '', { expires: new Date(0) });
    redirect('/login');
}

/**
 * Helper functions for role checking
 */
export async function isAdmin() {
    const session = await getSession();
    // Backward compatible: old sessions without role are treated as admin
    return session && (session.role === 'admin' || (!session.role && session.user));
}

export async function isContributor() {
    const session = await getSession();
    return session && session.role === 'contributor';
}

export async function getRole() {
    const session = await getSession();
    if (!session) return null;
    return session.role || 'admin'; // Default to admin for old sessions
}

