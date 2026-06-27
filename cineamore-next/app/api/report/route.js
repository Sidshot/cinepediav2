import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import { NextResponse } from 'next/server';
import { getRateLimit } from '@/lib/ratelimit';

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const { success } = await getRateLimit().limit(ip);
        if (!success) {
            return new NextResponse('Too Many Requests', { status: 429 });
        }

        const body = await req.json();

        if (!body.message) {
            return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
        }

        // Validate Input Length
        if (body.message.length > 1000) {
            return NextResponse.json({ success: false, error: 'Message must be under 1000 characters' }, { status: 400 });
        }
        if (body.email && body.email.length > 100) {
            return NextResponse.json({ success: false, error: 'Email must be under 100 characters' }, { status: 400 });
        }

        await dbConnect();

        const report = await Report.create(body);
        return NextResponse.json({ success: true, data: report }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
