const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'umi-umi-secret-key-change-in-production';

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const check = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === check;
}

function createToken(payload, expiresInMs = 7 * 24 * 60 * 60 * 1000) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Date.now() + expiresInMs;
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
    if (!token) return null;
    try {
        const [header, body, signature] = token.split('.');
        const check = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
        if (check !== signature) return null;
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
        if (payload.exp && Date.now() > payload.exp) return null;
        return payload;
    } catch (e) {
        return null;
    }
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach(c => {
        const [key, val] = c.trim().split('=');
        if (key && val) cookies[key] = decodeURIComponent(val);
    });
    return cookies;
}

function getAuth(req) {
    const cookies = parseCookies(req.headers.cookie || req.headers.get?.('cookie') || '');
    const authHeader = req.headers.authorization || req.headers.get?.('authorization') || '';
    const token = cookies.umi_token || authHeader.replace('Bearer ', '');
    return verifyToken(token);
}

module.exports = { hashPassword, verifyPassword, createToken, verifyToken, parseCookies, getAuth };
