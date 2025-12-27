import { NextResponse } from 'next/server';
import { sendMessage, sendPhoto } from '@/lib/telegram';

// Verify the secret token (optional but recommended security)
// const SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN;

export async function POST(req) {
    try {
        const update = await req.json();

        // DEBUG: Log all incoming updates
        console.log('[Telegram Webhook] Received update:', JSON.stringify(update, null, 2));

        // 0. Handle /ping command (DEBUG)
        if (update.message?.text === '/ping') {
            const chatId = update.message.chat.id;
            console.log('[Telegram] Responding to /ping in chat:', chatId);
            await sendMessage(chatId, '🏓 <b>Pong!</b> The bot is alive and connected.');
            return NextResponse.json({ ok: true });
        }

        // 0.5 Handle /post_now command (ADMIN - Trigger Daily Recs)
        if (update.message?.text === '/post_now') {
            const chatId = update.message.chat.id;
            console.log('[Telegram] Admin triggered /post_now in chat:', chatId);

            // Acknowledge the command
            await sendMessage(chatId, '⏳ <b>Posting daily recommendations...</b>');

            // Call the cron endpoint internally
            try {
                const baseUrl = process.env.VERCEL_URL
                    ? `https://${process.env.VERCEL_URL}`
                    : 'http://localhost:3000';
                const res = await fetch(`${baseUrl}/api/cron/daily`);
                const data = await res.json();

                if (data.ok) {
                    await sendMessage(chatId, '✅ <b>Daily recommendations posted!</b>');
                } else {
                    await sendMessage(chatId, '❌ <b>Failed:</b> ' + (data.error || 'Unknown error'));
                }
            } catch (e) {
                await sendMessage(chatId, '❌ <b>Error:</b> ' + e.message);
            }
            return NextResponse.json({ ok: true });
        }

        // 1. Handle New Chat Members (WELCOME)
        if (update.message?.new_chat_members) {
            const chatId = update.message.chat.id;
            const newMembers = update.message.new_chat_members;

            for (const member of newMembers) {
                if (member.is_bot) continue; // Skip bots

                const firstName = member.first_name || 'Movie Buff';
                const welcomeText = `
🎬 <b>Welcome to CinePedia, ${firstName}!</b>

We are your extensive library for Films, Series, and Anime.

<b>Everything is Free. Everything is HD.</b>

👇 <b>Get Started Here:</b>
`;
                // Send Welcome Photo + Buttons
                await sendPhoto(chatId, 'https://cinepedia.vercel.app/og-image.png', welcomeText, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '🎬 Browse Films', url: 'https://cinepedia.vercel.app/' },
                                { text: '📺 Browse Series', url: 'https://cinepedia.vercel.app/series' }
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

        // 2. Handle Callback Queries (Button Clicks)
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
3. Scroll down to the <b>Download</b> section.
4. Click the link for your preferred quality (1080p/4k).
5. It will verify your access and start the download!
`;
            } else if (data === 'guide_stream') {
                responseText = `
📡 <b>How to Stream</b>

1. Open any Movie or Series page.
2. Click the big <b>Play Button</b> on the poster.
3. <i>OR</i> scroll down to the built-in player.
4. Choose your server and enjoy!
`;
            }

            if (responseText) {
                await sendMessage(chatId, responseText);
            }

            // Answer callback to stop loading animation on button
            // (We skip this for simplicity here, but good practice is to hit answerCallbackQuery)
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('[Telegram Webhook] Error:', e);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
