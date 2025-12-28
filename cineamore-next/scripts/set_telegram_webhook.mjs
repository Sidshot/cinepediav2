// Script to set Telegram webhook
// Run with: node scripts/set_telegram_webhook.mjs

const TOKEN = '8310376679:AAEBETH_igtUgjG6DGfEgdDYnBjKLGnctsI';
const WEBHOOK_URL = 'https://cineamore.vercel.app/api/telegram';

async function setWebhook() {
    console.log('🔧 Setting Telegram Webhook...\n');

    // First, check current webhook status
    const infoRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getWebhookInfo`);
    const infoData = await infoRes.json();

    console.log('📋 Current Webhook Info:');
    console.log('   URL:', infoData.result?.url || '(not set)');
    console.log('   Pending Updates:', infoData.result?.pending_update_count || 0);
    console.log('   Last Error:', infoData.result?.last_error_message || '(none)');
    console.log('');

    // Set the webhook
    const setRes = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: WEBHOOK_URL,
            allowed_updates: ['message', 'callback_query']
        })
    });

    const setData = await setRes.json();

    if (setData.ok) {
        console.log('✅ Webhook set successfully!');
        console.log('   New URL:', WEBHOOK_URL);
    } else {
        console.log('❌ Failed to set webhook:');
        console.log('   Error:', setData.description);
    }

    // Verify the new webhook
    console.log('\n📋 Verifying new webhook...');
    const verifyRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getWebhookInfo`);
    const verifyData = await verifyRes.json();

    console.log('   URL:', verifyData.result?.url || '(not set)');
    console.log('   Pending Updates:', verifyData.result?.pending_update_count || 0);
}

setWebhook().catch(console.error);
