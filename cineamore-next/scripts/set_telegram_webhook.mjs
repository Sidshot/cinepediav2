// Script to set Telegram webhook
// Run with:
// TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... node scripts/set_telegram_webhook.mjs

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cinepediav2.vercel.app').replace(/\/$/, '');
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || `${SITE_URL}/api/telegram`;
const SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!SECRET_TOKEN) {
    throw new Error('TELEGRAM_WEBHOOK_SECRET is required');
}

async function telegram(method, init = {}) {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, init);
    const data = await res.json();
    if (!data.ok) {
        throw new Error(data.description || `${method} failed`);
    }
    return data;
}

async function setWebhook() {
    console.log('Setting Telegram webhook...');

    const infoData = await telegram('getWebhookInfo');
    console.log('Current URL:', infoData.result?.url || '(not set)');
    console.log('Pending Updates:', infoData.result?.pending_update_count || 0);
    console.log('Last Error:', infoData.result?.last_error_message || '(none)');

    await telegram('setWebhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: WEBHOOK_URL,
            secret_token: SECRET_TOKEN,
            allowed_updates: ['message', 'callback_query']
        })
    });

    console.log('Webhook set successfully.');
    console.log('New URL:', WEBHOOK_URL);

    const verifyData = await telegram('getWebhookInfo');
    console.log('Verified URL:', verifyData.result?.url || '(not set)');
    console.log('Pending Updates:', verifyData.result?.pending_update_count || 0);
}

setWebhook().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
