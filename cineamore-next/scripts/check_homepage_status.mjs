const url = 'https://cineamore.vercel.app/';
console.log(`Checking ${url}...`);
try {
    const res = await fetch(url);
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log('Body:', text.substring(0, 200));
} catch (e) {
    console.error('Error:', e.message);
}
