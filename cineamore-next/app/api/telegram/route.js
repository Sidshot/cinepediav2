import { NextResponse } from 'next/server';
import { sendMessage, sendPhoto } from '@/lib/telegram';

// Admin User ID (only this user can use admin commands in DM)
const ADMIN_ID = 5342146552;

export async function POST(req) {
    try {
        const update = await req.json();
        const message = update.message;

        // DEBUG: Log all incoming updates
        console.log('[Telegram Webhook] Received update:', JSON.stringify(update, null, 2));

        // ============ HANDLE TEXT COMMANDS ============
        if (message?.text) {
            const chatId = message.chat.id;
            const userId = message.from?.id;
            const text = message.text.trim();
            const isPrivate = message.chat.type === 'private';
            const isAdmin = userId === ADMIN_ID;

            // ---------- /ping (Anyone) ----------
            if (text === '/ping') {
                await sendMessage(chatId, '🏓 <b>Pong!</b> The bot is alive.');
                return NextResponse.json({ ok: true });
            }

            // ---------- /help (Admin DM only) ----------
            if (text === '/help' && isPrivate && isAdmin) {
                const helpText = `
🤖 <b>CineAmore Bot Admin Panel</b>

<b>Commands:</b>
/help - Show this help message
/status - Check bot status
/post_now - Post daily recommendations to group
/post_here - Post recommendations in this chat (test)

<b>Automatic Features:</b>
• Welcome new group members
• Daily posts at 10:00 AM UTC (3:30 PM IST)

<b>Group Chat ID:</b> ${process.env.TELEGRAM_CHAT_ID || 'Not set'}
`;
                await sendMessage(chatId, helpText);
                return NextResponse.json({ ok: true });
            }

            // ---------- /status (Admin DM only) ----------
            if (text === '/status' && isPrivate && isAdmin) {
                const statusText = `
📊 <b>Bot Status</b>

✅ <b>Bot:</b> Online
🔗 <b>Webhook:</b> Active
📢 <b>Target Group:</b> ${process.env.TELEGRAM_CHAT_ID || 'Not configured'}
⏰ <b>Daily Post:</b> 10:00 AM UTC

<b>Features:</b>
• Welcome Messages: ✅ Enabled
• Daily Posts: ✅ Enabled
`;
                await sendMessage(chatId, statusText);
                return NextResponse.json({ ok: true });
            }

            // ---------- /post_now (Admin - Posts to GROUP) ----------
            if (text === '/post_now' && isAdmin) {
                const targetChatId = process.env.TELEGRAM_CHAT_ID;
                if (!targetChatId) {
                    await sendMessage(chatId, '❌ <b>Error:</b> TELEGRAM_CHAT_ID not configured.');
                    return NextResponse.json({ ok: true });
                }

                await sendMessage(chatId, '⏳ <b>Posting to group...</b>');

                const { postDailyRecommendations } = await import('@/lib/daily-recs');
                const result = await postDailyRecommendations(targetChatId);

                if (result.ok) {
                    await sendMessage(chatId, '✅ <b>Posted to group!</b>');
                } else {
                    await sendMessage(chatId, '❌ <b>Failed:</b> ' + (result.error || 'Unknown error'));
                }
                return NextResponse.json({ ok: true });
            }

            // ---------- /post_here (Admin DM - Posts to current chat for testing) ----------
            if (text === '/post_here' && isPrivate && isAdmin) {
                await sendMessage(chatId, '⏳ <b>Posting test recommendations here...</b>');

                const { postDailyRecommendations } = await import('@/lib/daily-recs');
                const result = await postDailyRecommendations(chatId);

                if (result.ok) {
                    await sendMessage(chatId, '✅ <b>Test complete!</b>');
                } else {
                    await sendMessage(chatId, '❌ <b>Failed:</b> ' + (result.error || 'Unknown error'));
                }
                return NextResponse.json({ ok: true });
            }

            // ---------- Unknown command in Admin DM ----------
            if (isPrivate && isAdmin && text.startsWith('/')) {
                await sendMessage(chatId, '❓ Unknown command. Type /help for available commands.');
                return NextResponse.json({ ok: true });
            }

            // ---------- Non-admin DM ----------
            if (isPrivate && !isAdmin) {
                await sendMessage(chatId, '👋 Hi! I only respond to my admin. Join our group for updates!');
                return NextResponse.json({ ok: true });
            }
        }

        // ============ HANDLE NEW MEMBERS (WELCOME) ============
        if (message?.new_chat_members) {
            const chatId = message.chat.id;
            const newMembers = message.new_chat_members;

            for (const member of newMembers) {
                if (member.is_bot) continue;

                const firstName = member.first_name || 'Movie Buff';
                const welcomeText = `
🎬 <b>Welcome to CineAmore, ${firstName}!</b>

Your gateway to unlimited Movies, Series & Anime.

<b>Everything is Free. Everything is HD.</b>

👇 <b>Get Started:</b>
`;
                await sendPhoto(chatId, 'https://cineamore.vercel.app/og-image.png', welcomeText, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '🎬 Browse Films', url: 'https://cineamore.vercel.app/' },
                                { text: '📺 Browse Series', url: 'https://cineamore.vercel.app/series' }
                            ],
                            [
                                { text: '❓ How to Download', callback_data: 'guide_download' },
                                { text: '📡 How to Stream', callback_data: 'guide_stream' }
                            ]
                        ]
                    }
                });
            }
        }

        // ============ HANDLE BUTTON CALLBACKS ============
        if (update.callback_query) {
            const query = update.callback_query;
            const chatId = query.message.chat.id;
            const data = query.data;

            let responseText = '';

            if (data === 'guide_download') {
                responseText = `
📥 <b>How to Download</b>

1. Search for your movie/show.
2. Open the details page.
3. Scroll down to <b>Download</b> section.
4. Click your preferred quality (1080p/4k).
5. Download starts automatically!
`;
            } else if (data === 'guide_stream') {
                responseText = `
📡 <b>How to Stream</b>

1. Open any Movie or Series page.
2. Click the <b>Play Button</b> on the poster.
3. <i>OR</i> scroll to the built-in player.
4. Choose your server and enjoy!
`;
            }

            if (responseText) {
                await sendMessage(chatId, responseText);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('[Telegram Webhook] Error:', e);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
