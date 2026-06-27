import { NextResponse } from 'next/server';
import { sendMessage, sendPhoto } from '@/lib/telegram';

// Admin User ID (only this user can use admin commands in DM)
const ADMIN_ID = Number(process.env.TELEGRAM_ADMIN_ID || '5342146552');
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cinepediav2.vercel.app').replace(/\/$/, '');

function verifyTelegramSecret(req) {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!expectedSecret) {
        return process.env.NODE_ENV !== 'production';
    }
    return req.headers.get('x-telegram-bot-api-secret-token') === expectedSecret;
}

export async function POST(req) {
    try {
        if (!verifyTelegramSecret(req)) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const update = await req.json();
        const message = update.message;

        // DEBUG: Log all incoming updates
        console.log('[Telegram Webhook] Received update:', JSON.stringify(update, null, 2));

        // ============ HANDLE TEXT COMMANDS ============
        if (message?.text) {
            const chatId = message.chat.id;
            const userId = message.from?.id;
            const rawText = message.text.trim();

            // RESILIENCE: Wrap all command processing in try-catch
            // so a bug in one command doesn't break the entire webhook
            try {
                // Handle @botname - remove it from start or end of message
                // Examples: "@Cineamore_bot hello" -> "hello", "/ping@Cineamore_bot" -> "/ping"
                const cleanText = rawText.replace(/@\w+/gi, '').trim().toLowerCase();
                const isPrivate = message.chat.type === 'private';
                const isAdmin = userId === ADMIN_ID;

                // ---------- /ping (Anyone) ----------
                if (cleanText === '/ping') {
                    await sendMessage(chatId, '🏓 <b>Pong!</b> The bot is alive.');
                    return NextResponse.json({ ok: true });
                }

                // ============ PUBLIC COMMANDS (Anyone in Group) ============

                // ---------- /random - Get a random movie ----------
                if (cleanText === '/random' && (!isPrivate || isAdmin)) {
                    try {
                        const { default: dbConnect } = await import('@/lib/mongodb');
                        const mongoose = await import('mongoose');
                        await dbConnect();
                        const db = mongoose.default.connection.db;
                        const [movie] = await db.collection('movies').aggregate([{ $sample: { size: 1 } }]).toArray();

                        if (movie) {
                            const movieId = movie.__id || movie._id.toString();
                            const caption = `
🎲 <b>Random Pick for You!</b>
<b>${movie.title}</b> (${movie.year || 'N/A'})

${movie.plot ? movie.plot.substring(0, 120) + '...' : ''}

👉 ${SITE_URL}/movie/${movieId}
`;
                            await sendPhoto(chatId, movie.posterUrl, caption);
                        } else {
                            await sendMessage(chatId, '🎲 No movies found! Try again later.');
                        }
                    } catch (e) {
                        await sendMessage(chatId, '❌ Error fetching random movie.');
                    }
                    return NextResponse.json({ ok: true });
                }

                // ---------- /site - Link to website ----------
                if (cleanText === '/site' || cleanText === '/website') {
                    await sendMessage(chatId, `
🌐 <b>CineAmore</b>

Your gateway to unlimited Movies, Series & Anime!

👉 <a href="${SITE_URL}">CineAmore</a>
`);
                    return NextResponse.json({ ok: true });
                }

                // ---------- /download - How to download ----------
                if (cleanText === '/download') {
                    await sendMessage(chatId, `
📥 <b>How to Download</b>

1. Open any movie page
2. Scroll to <b>Download Links</b>
3. Click your preferred quality
4. Done! 🎉

👉 <a href="${SITE_URL}">Browse Movies</a>
`);
                    return NextResponse.json({ ok: true });
                }

                // ---------- /stream - How to stream ----------
                if (cleanText === '/stream') {
                    await sendMessage(chatId, `
📡 <b>How to Stream</b>

1. Open any Movie or Series page
2. Click the <b>Play</b> button on poster
3. Choose a server & enjoy!

👉 <a href="${SITE_URL}">Browse Content</a>
`);
                    return NextResponse.json({ ok: true });
                }

                // ---------- /commands - Show public commands ----------
                if (cleanText === '/commands' && !isPrivate) {
                    await sendMessage(chatId, `
🤖 <b>Available Commands</b>

/random - Get a random movie
/search [title] - Search for a movie
/site - Visit CineAmore website
/download - How to download
/stream - How to stream
/ping - Check if bot is alive

💡 <i>Or just ask naturally: "recommend me something"</i>
`);
                    return NextResponse.json({ ok: true });
                }

                // ---------- /search [query] - Search movies ----------
                if (cleanText.startsWith('/search')) {
                    const query = rawText.replace(/\/search(@\w+)?/i, '').trim();
                    if (!query) {
                        await sendMessage(chatId, '🔍 <b>Usage:</b> /search Movie Title\n\nExample: /search Inception');
                        return NextResponse.json({ ok: true });
                    }

                    try {
                        const { default: dbConnect } = await import('@/lib/mongodb');
                        const mongoose = await import('mongoose');
                        await dbConnect();
                        const db = mongoose.default.connection.db;

                        const movies = await db.collection('movies')
                            .find({ title: { $regex: query, $options: 'i' } })
                            .limit(5)
                            .toArray();

                        if (movies.length > 0) {
                            let resultText = `🔍 <b>Search Results for "${query}":</b>\n\n`;
                            movies.forEach((m, i) => {
                                const movieId = m.__id || m._id.toString();
                                resultText += `${i + 1}. <b>${m.title}</b> (${m.year || 'N/A'})\n👉 ${SITE_URL}/movie/${movieId}\n\n`;
                            });
                            await sendMessage(chatId, resultText);
                        } else {
                            await sendMessage(chatId, `🔍 No movies found for "${query}". Try a different title!`);
                        }
                    } catch (e) {
                        await sendMessage(chatId, '❌ Search failed. Try again later.');
                    }
                    return NextResponse.json({ ok: true });
                }

                // ============ NATURAL LANGUAGE TRIGGERS ============
                // Use cleanText which has @botname removed

                // Greetings
                if (/^(hi|hello|hey|hye|yo|sup|hola|namaste|hii+)\b/i.test(cleanText)) {
                    const greetings = [
                        '👋 Hey there! Type /commands to see what I can do!',
                        '🎬 Hello! Looking for a movie? Try /random!',
                        '👋 Hi! Need help? Type /commands!',
                    ];
                    await sendMessage(chatId, greetings[Math.floor(Math.random() * greetings.length)]);
                    return NextResponse.json({ ok: true });
                }

                // Thank you
                if (/thank|thanks|thx|ty\b/i.test(cleanText)) {
                    const responses = [
                        '😊 You\'re welcome! Enjoy your movie!',
                        '🎬 Happy to help! Enjoy watching!',
                        '👍 Anytime! Have fun streaming!',
                    ];
                    await sendMessage(chatId, responses[Math.floor(Math.random() * responses.length)]);
                    return NextResponse.json({ ok: true });
                }

                // Movie recommendation requests
                if (/recommend|suggest|what.*(watch|movie|film)|bored|something to watch/i.test(cleanText)) {
                    try {
                        const { default: dbConnect } = await import('@/lib/mongodb');
                        const mongoose = await import('mongoose');
                        await dbConnect();
                        const db = mongoose.default.connection.db;
                        const [movie] = await db.collection('movies').aggregate([{ $sample: { size: 1 } }]).toArray();

                        if (movie) {
                            const movieId = movie.__id || movie._id.toString();
                            const caption = `
🎬 <b>Here's something for you!</b>
<b>${movie.title}</b> (${movie.year || 'N/A'})

${movie.plot ? movie.plot.substring(0, 120) + '...' : ''}

👉 ${SITE_URL}/movie/${movieId}
`;
                            await sendPhoto(chatId, movie.posterUrl, caption);
                        }
                    } catch (e) {
                        await sendMessage(chatId, '🎬 Try /random for a movie recommendation!');
                    }
                    return NextResponse.json({ ok: true });
                }

                // Good night/morning
                if (/good\s*(night|evening)/i.test(cleanText)) {
                    await sendMessage(chatId, '🌙 Good night! Sweet dreams and happy watching tomorrow!');
                    return NextResponse.json({ ok: true });
                }
                if (/good\s*(morning|day)/i.test(cleanText)) {
                    await sendMessage(chatId, '☀️ Good morning! Ready for some movies today? Try /random!');
                    return NextResponse.json({ ok: true });
                }

                // Bot mentions or questions about the bot
                if (/who.*(are|r) (you|u)|what.*(are|r) (you|u)|your name/i.test(cleanText)) {
                    await sendMessage(chatId, `
🤖 <b>I'm CineAmore Bot!</b>

I help you discover movies, series & anime.

<b>My powers:</b>
• Random movie recommendations
• Movie search
• Download & streaming guides
• Daily content updates

Type /commands to see what I can do! 🎬
`);
                    return NextResponse.json({ ok: true });
                }

                // ---------- /help (Admin DM only) ----------
                if (cleanText === '/help' && isPrivate && isAdmin) {
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
                if (cleanText === '/status' && isPrivate && isAdmin) {
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
                if (cleanText === '/post_now' && isAdmin) {
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
                if (cleanText === '/post_here' && isPrivate && isAdmin) {
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
                if (isPrivate && isAdmin && cleanText.startsWith('/')) {
                    await sendMessage(chatId, '❓ Unknown command. Type /help for available commands.');
                    return NextResponse.json({ ok: true });
                }

                // ---------- Non-admin DM ----------
                if (isPrivate && !isAdmin) {
                    await sendMessage(chatId, '👋 Hi! I only respond to my admin. Join our group for updates!');
                    return NextResponse.json({ ok: true });
                }
            } catch (commandError) {
                // RESILIENCE: Log error but don't crash - bot continues working
                console.error('[Telegram Webhook] Command processing error:', commandError.message);
                // Optionally notify user of error
                try {
                    await sendMessage(chatId, '⚠️ Something went wrong. Please try again.');
                } catch (e) { /* ignore send errors */ }
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
                await sendPhoto(chatId, `${SITE_URL}/og-image.png`, welcomeText, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '🎬 Browse Films', url: `${SITE_URL}/` },
                                { text: '📺 Browse Series', url: `${SITE_URL}/series` }
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
