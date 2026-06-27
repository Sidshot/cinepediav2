import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Contributor from '@/models/Contributor';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

function getAdminPassword() {
    if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
    if (process.env.NODE_ENV === 'production') return null;
    return 'admin123';
}

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: 'Password required' }, { status: 400 });
        }

        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const cookieStore = await cookies();

        // ADMIN LOGIN: No username, just password
        if (!username || username.trim() === '') {
            const adminPassword = getAdminPassword();
            if (adminPassword && password === adminPassword) {
                const session = await encrypt({
                    user: 'admin',
                    role: 'admin',
                    expires
                });

                cookieStore.set('session', session, {
                    expires,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/'
                });

                return NextResponse.json({ success: true, redirect: '/admin' });
            } else {
                return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
            }
        }

        // CONTRIBUTOR LOGIN: Username + Password
        await dbConnect();

        const cleanUsername = username.toLowerCase().replace(/^@/, '');

        const contributor = await Contributor.findOne({
            username: cleanUsername,
            isActive: true
        }).lean();

        if (!contributor || !contributor.password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const passwordMatches = await bcrypt.compare(password, contributor.password);

        if (!passwordMatches) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create session
        const session = await encrypt({
            user: contributor.username,
            role: 'contributor',
            contributorId: contributor._id.toString(),
            displayName: contributor.displayName || contributor.username,
            expires
        });

        cookieStore.set('session', session, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });

        return NextResponse.json({ success: true, redirect: '/contributor' });
    } catch (e) {
        console.error('[API Login] Error:', e);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
