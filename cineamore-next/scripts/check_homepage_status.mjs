const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cinepediav2.vercel.app').replace(/\/$/, '');
const url = `${SITE_URL}/`;
console.log(`Checking ${url}...`);
try {
    const res = await fetch(url);
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log('Body:', text.substring(0, 200));
} catch (e) {
    console.error('Error:', e.message);
}
