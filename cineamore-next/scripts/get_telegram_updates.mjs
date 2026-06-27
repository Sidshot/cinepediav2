const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const url = `https://api.telegram.org/bot${token}/getUpdates`;

try {
    const res = await fetch(url);
    const json = await res.json();

    if (json.result && json.result.length > 0) {
        const firstMessage = json.result[0].message;
        console.log('CHAT_ID:', firstMessage?.chat?.id || '(missing)');
        console.log('CHAT_TITLE:', firstMessage?.chat?.title || '(missing)');
    } else {
        console.log('No updates found.');
    }
} catch (error) {
    console.error('Error:', error.message);
    process.exitCode = 1;
}
