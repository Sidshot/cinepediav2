import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.DOWNLOAD_SECRET || process.env.AUTH_SECRET || process.env.JWT_SECRET;

if (!secretKey && process.env.NODE_ENV === 'production') {
    throw new Error('Missing DOWNLOAD_SECRET or AUTH_SECRET in production');
}

if (!secretKey) {
    console.warn('DOWNLOAD_SECRET, AUTH_SECRET or JWT_SECRET missing. Using a development-only token key.');
}

const finalKey = secretKey || 'dev-fallback-secret-key';
const key = new TextEncoder().encode(finalKey);

export async function signDownloadToken(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30s')
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
