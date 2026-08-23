const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'umi-umi-secret-key-change-in-production';
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// ============================================
// Utility Functions
// ============================================

function uuid() {
    return crypto.randomUUID();
}

// Simple password hashing using Node's built-in crypto
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

// Simple JWT-like token (HMAC-signed)
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

// Parse cookies from header
function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach(c => {
        const [key, val] = c.trim().split('=');
        if (key && val) cookies[key] = decodeURIComponent(val);
    });
    return cookies;
}

// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

// ============================================
// Data Layer
// ============================================

function readData(filename) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) return [];
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function writeData(filename, data) {
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

function readSettings() {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'settings.json'), 'utf8'));
}

function writeSettings(settings) {
    fs.writeFileSync(path.join(DATA_DIR, 'settings.json'), JSON.stringify(settings, null, 2));
}

// Initialize default password
(function initAdmin() {
    const settings = readSettings();
    if (settings.adminPassword === '$2a$10$placeholder') {
        settings.adminPassword = hashPassword('umiumi2026');
        writeSettings(settings);
        console.log('✿ Default admin password set: umiumi2026');
    }
})();

// ============================================
// Parse request body (JSON & multipart)
// ============================================

function parseJSONBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

function parseMultipart(req) {
    return new Promise((resolve, reject) => {
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+)/);
        if (!boundaryMatch) {
            // Fallback: parse as URL-encoded or JSON
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    resolve({ fields: JSON.parse(body), file: null });
                } catch (e) {
                    // Parse URL-encoded
                    const fields = {};
                    body.split('&').forEach(pair => {
                        const [k, v] = pair.split('=');
                        if (k) fields[decodeURIComponent(k)] = decodeURIComponent(v || '');
                    });
                    resolve({ fields, file: null });
                }
            });
            return;
        }

        const boundary = boundaryMatch[1];
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const parts = splitMultipart(buffer, boundary);
            const fields = {};
            let file = null;

            for (const part of parts) {
                const headerEnd = part.indexOf('\r\n\r\n');
                if (headerEnd === -1) continue;

                const headers = part.slice(0, headerEnd).toString();
                const content = part.slice(headerEnd + 4);

                const nameMatch = headers.match(/name="([^"]+)"/);
                const filenameMatch = headers.match(/filename="([^"]+)"/);

                if (filenameMatch && nameMatch) {
                    const ext = path.extname(filenameMatch[1]).toLowerCase();
                    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                        const filename = `product-${Date.now()}${ext}`;
                        const filepath = path.join(UPLOADS_DIR, filename);
                        // Remove trailing \r\n
                        const cleanContent = content.length >= 2 && content[content.length - 2] === 13 && content[content.length - 1] === 10
                            ? content.slice(0, -2) : content;
                        fs.writeFileSync(filepath, cleanContent);
                        file = { filename, path: `/uploads/${filename}` };
                    }
                } else if (nameMatch) {
                    let val = content.toString();
                    if (val.endsWith('\r\n')) val = val.slice(0, -2);
                    fields[nameMatch[1]] = val;
                }
            }

            resolve({ fields, file });
        });
        req.on('error', reject);
    });
}

function splitMultipart(buffer, boundary) {
    const sep = Buffer.from(`--${boundary}`);
    const parts = [];
    let start = 0;

    while (true) {
        const idx = buffer.indexOf(sep, start);
        if (idx === -1) break;

        if (start > 0) {
            // Skip the \r\n after boundary
            const partStart = start;
            const partEnd = idx - 2; // Remove trailing \r\n before boundary
            if (partEnd > partStart) {
                parts.push(buffer.slice(partStart, partEnd));
            }
        }

        start = idx + sep.length;
        // Skip \r\n after boundary
        if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
        // Check for -- (end boundary)
        if (buffer[start] === 45 && buffer[start + 1] === 45) break;
    }

    return parts;
}

// ============================================
// Router
// ============================================

function sendJSON(res, data, status = 200) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
}

function sendError(res, message, status = 400) {
    sendJSON(res, { error: message }, status);
}

function serveStatic(res, filepath) {
    if (!fs.existsSync(filepath)) return false;

    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
        filepath = path.join(filepath, 'index.html');
        if (!fs.existsSync(filepath)) return false;
    }

    const ext = path.extname(filepath);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filepath).pipe(res);
    return true;
}

// ============================================
// Request Handler
// ============================================

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;
    const method = req.method;

    // CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });
        res.end();
        return;
    }

    // Get auth token
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.umi_token || (req.headers.authorization || '').replace('Bearer ', '');
    const auth = verifyToken(token);

    // Helper to require auth
    function requireAuth() {
        if (!auth) { sendError(res, 'Unauthorized', 401); return false; }
        return true;
    }

    try {
        // ============================
        // AUTH ROUTES
        // ============================

        if (pathname === '/api/auth/login' && method === 'POST') {
            const body = await parseJSONBody(req);
            const settings = readSettings();

            if (!verifyPassword(body.password || '', settings.adminPassword)) {
                return sendError(res, 'Invalid password', 401);
            }

            const newToken = createToken({ role: 'admin' });
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Set-Cookie': `umi_token=${newToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
            });
            res.end(JSON.stringify({ success: true }));
            return;
        }

        if (pathname === '/api/auth/logout' && method === 'POST') {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Set-Cookie': 'umi_token=; HttpOnly; Path=/; Max-Age=0'
            });
            res.end(JSON.stringify({ success: true }));
            return;
        }

        if (pathname === '/api/auth/check' && method === 'GET') {
            if (!auth) return sendError(res, 'Unauthorized', 401);
            return sendJSON(res, { authenticated: true });
        }

        if (pathname === '/api/auth/change-password' && method === 'POST') {
            if (!requireAuth()) return;
            const body = await parseJSONBody(req);
            const settings = readSettings();

            if (!verifyPassword(body.currentPassword || '', settings.adminPassword)) {
                return sendError(res, 'Current password is incorrect', 401);
            }

            settings.adminPassword = hashPassword(body.newPassword);
            writeSettings(settings);
            return sendJSON(res, { success: true });
        }

        // ============================
        // PUBLIC API
        // ============================

        if (pathname === '/api/products' && method === 'GET') {
            const products = readData('products.json').filter(p => p.active);
            return sendJSON(res, products);
        }

        if (pathname === '/api/categories' && method === 'GET') {
            const categories = readData('categories.json').sort((a, b) => a.order - b.order);
            return sendJSON(res, categories);
        }

        if (pathname === '/api/settings/public' && method === 'GET') {
            const settings = readSettings();
            return sendJSON(res, {
                storeName: settings.storeName,
                promoCode: settings.promoCode,
                promoDiscount: settings.promoDiscount,
                freeShippingThreshold: settings.freeShippingThreshold,
                announcementText: settings.announcementText
            });
        }

        // ============================
        // ADMIN API — Products
        // ============================

        if (pathname === '/api/admin/products' && method === 'GET') {
            if (!requireAuth()) return;
            return sendJSON(res, readData('products.json'));
        }

        if (pathname === '/api/admin/products' && method === 'POST') {
            if (!requireAuth()) return;
            const { fields, file } = await parseMultipart(req);
            const products = readData('products.json');

            const newProduct = {
                id: `prod_${uuid().slice(0, 8)}`,
                name: fields.name || '',
                description: fields.description || '',
                price: parseFloat(fields.price) || 0,
                category: fields.category || '',
                badge: fields.badge || '',
                image: file ? file.path : null,
                gradient: fields.gradient || 'linear-gradient(160deg, #E0F5F0 0%, #C8E6E0 50%, #E8B4B8 100%)',
                emoji: fields.emoji || '✿',
                active: fields.active !== 'false',
                createdAt: new Date().toISOString()
            };

            products.push(newProduct);
            writeData('products.json', products);
            return sendJSON(res, newProduct, 201);
        }

        const productMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)$/);
        if (productMatch && method === 'PUT') {
            if (!requireAuth()) return;
            const { fields, file } = await parseMultipart(req);
            const products = readData('products.json');
            const index = products.findIndex(p => p.id === productMatch[1]);
            if (index === -1) return sendError(res, 'Product not found', 404);

            products[index] = {
                ...products[index],
                name: fields.name || products[index].name,
                description: fields.description !== undefined ? fields.description : products[index].description,
                price: fields.price ? parseFloat(fields.price) : products[index].price,
                category: fields.category !== undefined ? fields.category : products[index].category,
                badge: fields.badge !== undefined ? fields.badge : products[index].badge,
                gradient: fields.gradient || products[index].gradient,
                emoji: fields.emoji !== undefined ? fields.emoji : products[index].emoji,
                active: fields.active !== undefined ? fields.active !== 'false' : products[index].active,
                image: file ? file.path : products[index].image
            };

            writeData('products.json', products);
            return sendJSON(res, products[index]);
        }

        if (productMatch && method === 'DELETE') {
            if (!requireAuth()) return;
            let products = readData('products.json');
            const product = products.find(p => p.id === productMatch[1]);
            if (!product) return sendError(res, 'Product not found', 404);

            if (product.image) {
                const imgPath = path.join(__dirname, product.image);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }

            products = products.filter(p => p.id !== productMatch[1]);
            writeData('products.json', products);
            return sendJSON(res, { success: true });
        }

        // ============================
        // ADMIN API — Categories
        // ============================

        if (pathname === '/api/admin/categories' && method === 'GET') {
            if (!requireAuth()) return;
            const categories = readData('categories.json').sort((a, b) => a.order - b.order);
            return sendJSON(res, categories);
        }

        if (pathname === '/api/admin/categories' && method === 'POST') {
            if (!requireAuth()) return;
            const body = await parseJSONBody(req);
            const categories = readData('categories.json');

            const slug = (body.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const newCategory = {
                id: `cat_${uuid().slice(0, 8)}`,
                name: body.name,
                slug,
                order: categories.length + 1
            };

            categories.push(newCategory);
            writeData('categories.json', categories);
            return sendJSON(res, newCategory, 201);
        }

        const categoryMatch = pathname.match(/^\/api\/admin\/categories\/([^/]+)$/);
        if (categoryMatch && method === 'PUT') {
            if (!requireAuth()) return;
            const body = await parseJSONBody(req);
            const categories = readData('categories.json');
            const index = categories.findIndex(c => c.id === categoryMatch[1]);
            if (index === -1) return sendError(res, 'Category not found', 404);

            if (body.name) {
                categories[index].name = body.name;
                categories[index].slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
            if (body.order !== undefined) categories[index].order = body.order;

            writeData('categories.json', categories);
            return sendJSON(res, categories[index]);
        }

        if (categoryMatch && method === 'DELETE') {
            if (!requireAuth()) return;
            let categories = readData('categories.json');
            categories = categories.filter(c => c.id !== categoryMatch[1]);
            writeData('categories.json', categories);
            return sendJSON(res, { success: true });
        }

        // ============================
        // ADMIN API — Settings
        // ============================

        if (pathname === '/api/admin/settings' && method === 'GET') {
            if (!requireAuth()) return;
            const settings = readSettings();
            const { adminPassword, ...publicSettings } = settings;
            return sendJSON(res, publicSettings);
        }

        if (pathname === '/api/admin/settings' && method === 'PUT') {
            if (!requireAuth()) return;
            const body = await parseJSONBody(req);
            const settings = readSettings();

            if (body.storeName !== undefined) settings.storeName = body.storeName;
            if (body.promoCode !== undefined) settings.promoCode = body.promoCode;
            if (body.promoDiscount !== undefined) settings.promoDiscount = body.promoDiscount;
            if (body.freeShippingThreshold !== undefined) settings.freeShippingThreshold = body.freeShippingThreshold;
            if (body.announcementText !== undefined) settings.announcementText = body.announcementText;

            writeSettings(settings);
            return sendJSON(res, settings);
        }

        // ============================
        // STATIC FILE SERVING
        // ============================

        // Uploads
        if (pathname.startsWith('/uploads/')) {
            const filepath = path.join(__dirname, pathname);
            if (serveStatic(res, filepath)) return;
        }

        // Admin files
        if (pathname.startsWith('/admin')) {
            const filePath = pathname === '/admin' || pathname === '/admin/'
                ? path.join(__dirname, 'public', 'admin', 'index.html')
                : path.join(__dirname, 'public', 'admin', pathname.replace('/admin/', ''));
            if (serveStatic(res, filePath)) return;
            // Fallback to admin index for SPA
            if (serveStatic(res, path.join(__dirname, 'public', 'admin', 'index.html'))) return;
        }

        // Store files (everything else)
        const storeFile = path.join(__dirname, 'public', 'store', pathname === '/' ? 'index.html' : pathname);
        if (serveStatic(res, storeFile)) return;

        // Final fallback — serve store index
        serveStatic(res, path.join(__dirname, 'public', 'store', 'index.html'));

    } catch (err) {
        console.error('Server error:', err);
        sendError(res, 'Internal server error', 500);
    }
});

server.listen(PORT, () => {
    console.log(`\n🌊 Umi Umi server running on http://localhost:${PORT}`);
    console.log(`   Storefront: http://localhost:${PORT}`);
    console.log(`   Admin:      http://localhost:${PORT}/admin`);
    console.log(`\n✿ Default admin password: umiumi2026\n`);
});
