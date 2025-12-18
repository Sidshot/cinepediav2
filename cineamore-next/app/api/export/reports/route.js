import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(req) {
    // 1. Auth Check
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const reports = await Report.find({}).sort({ createdAt: -1 }).lean();

        // 2. Format as human-readable plain text
        const separator = '─'.repeat(60);
        const doubleSeparator = '═'.repeat(60);
        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Count stats
        const openCount = reports.filter(r => !r.resolved).length;
        const fixedCount = reports.filter(r => r.resolved).length;

        // Header
        let content = `${doubleSeparator}
  CINEAMORE - REPORTED ISSUES
  Generated: ${today}
  Total Reports: ${reports.length} (🔴 ${openCount} Open, ✅ ${fixedCount} Fixed)
${doubleSeparator}

`;

        // Each report
        reports.forEach((r, index) => {
            const date = new Date(r.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const status = r.resolved ? '✅ FIXED' : '🔴 OPEN';
            const name = r.name || 'Anonymous';
            const movie = r.movieTitle || 'General Report';
            const message = r.message || 'No message provided';

            content += `${separator}
[#${index + 1}] ${movie}
${separator}
Reporter:  ${name}
Status:    ${status}
Date:      ${date}

Message:
${message}

`;
        });

        // Footer
        content += `${doubleSeparator}
  END OF REPORT
${doubleSeparator}
`;

        // 3. Return Plain Text File
        return new NextResponse(content, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="reports-${new Date().toISOString().split('T')[0]}.txt"`
            }
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

