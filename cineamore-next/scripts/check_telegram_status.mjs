import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from .env.local in the parent directory (cineamore-next root)
config({ path: path.join(__dirname, '../.env.local') });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is missing in .env.local');
    // Don't exit, just let the user know. 
    process.exit(1);
}

console.log(`Using Token: ${token.substring(0, 9)}...`);

const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;
console.log('Checking Webhook Status...');

try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
} catch (e) {
    console.error('❌ Error fetching webhook info:', e.message);
}
