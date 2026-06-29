/**
 * EDGE RUNTIME COMPATIBLE ONLY
 *
 * This file MUST NOT import:
 * - mongoose
 * - fs
 * - net
 * - Any Node.js specific modules
 *
 * It is used by middleware.js which runs on the Edge.
 */
import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.AUTH_SECRET || process.env.JWT_SECRET;

if (!secretKey && process.env.NODE_ENV === 'production') {
    throw new Error('Missing AUTH_SECRET or JWT_SECRET in production');
}

if (!secretKey) {
    console.warn('AUTH_SECRET or JWT_SECRET is missing. Using a development-only token key.');
}

const finalKey = secretKey || 'dev-secret-key-do-not-use-in-prod';
const key = new TextEncoder().encode(finalKey);

export async function encrypt(payload, options = {}) {
    const { expiresAt, expiresIn = '24h' } = options;
    const jwt = new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt();

    if (expiresAt) {
        jwt.setExpirationTime(Math.floor(new Date(expiresAt).getTime() / 1000));
    } else {
        jwt.setExpirationTime(expiresIn);
    }

    return await jwt.sign(key);
}

export async function decrypt(token) {
    try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
        return payload;
    } catch (error) {
        return null;
    }
}
