const url = 'https://cineamore.vercel.app/api/telegram';
console.log(`Checking ${url}...`);
try {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty update
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log('Body:', text.substring(0, 200));
} catch (e) {
    console.error('Error:', e.message);
}
