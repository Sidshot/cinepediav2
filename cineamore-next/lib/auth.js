import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Contributor from '@/models/Contributor';

const secretKey = process.env.JWT_SECRET || 'default-secret-key-change-me-in-prod';
const key = new TextEncoder().encode(secretKey);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function encrypt(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);
}

export async function decrypt(token) {
    try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
        return payload;
    } catch {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    return await decrypt(session);
}

/**
 * Login function - supports both admin and contributor login
 * Note: This server action is kept for backward compatibility but the primary
 * login flow now uses /api/auth/login route
 */
export async function login(formData) {
    'use server';

    const username = formData.get('username')?.trim();
    const password = formData.get('password');

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

    // ADMIN LOGIN: No username, just password
    if (!username && password === ADMIN_PASSWORD) {
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
                password: password,
                isActive: true
            }).lean();

            if (contributor) {
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
