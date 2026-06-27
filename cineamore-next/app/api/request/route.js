import dbConnect from '@/lib/mongodb';
import Request from '@/models/Request';
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

        if (!body.title) {
            return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
        }

        // Validate Input Length
        if (body.title.length > 200) {
            return NextResponse.json({ success: false, error: 'Title must be under 200 characters' }, { status: 400 });
        }
        if (body.details && body.details.length > 500) {
            return NextResponse.json({ success: false, error: 'Details must be under 500 characters' }, { status: 400 });
        }

        await dbConnect();

        const request = await Request.create(body);
        return NextResponse.json({ success: true, data: request }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
