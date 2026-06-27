import dbConnect from '@/lib/mongodb';
import Request from '@/models/Request';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(req) {
    // 1. Auth Check (Protect Admin Data)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const requests = await Request.find({}).sort({ createdAt: -1 }).lean();

        // 2. Convert to CSV
        const escapeCsv = (value) => {
            const stringValue = String(value || '');
            const safeValue = /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;
            return `"${safeValue.replace(/"/g, '""')}"`;
        };

        const csvHeader = 'Title,Status,Requested At\n';
        const csvRows = requests.map(r => {
            const date = new Date(r.createdAt).toISOString();
            const status = r.resolved ? 'Resolved' : 'Pending';
            return [escapeCsv(r.title), escapeCsv(status), escapeCsv(date)].join(',');
        }).join('\n');

        const csvContent = csvHeader + csvRows;

        // 3. Return CSV File
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="requests-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
