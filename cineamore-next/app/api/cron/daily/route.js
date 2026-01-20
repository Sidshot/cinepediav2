import { NextResponse } from 'next/server';
import { sendPhoto } from '@/lib/telegram';
import clientPromise from '@/lib/mongodb';

// Vercel Cron Secret for security
// const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req) {
    // QUOTA FIX: Telegram bot disabled by user to save function invocations
    return NextResponse.json({ ok: true, status: 'disabled' });
}
