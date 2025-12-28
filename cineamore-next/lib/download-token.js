
import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET;
if (!secretKey) {
    console.warn('⚠️ DOWNLOAD_SECRET or JWT_SECRET missing! Downloads will fail.');
}
const finalKey = secretKey || 'dev-fallback-secret-key';
const key = new TextEncoder().encode(finalKey);

export async function signDownloadToken(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30s') // Short life: Scraper must click NOW
        .sign(key);
}

export async function verifyDownloadToken(token) {
    try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
        return payload;
    } catch (e) {
        return null;
    }
}
