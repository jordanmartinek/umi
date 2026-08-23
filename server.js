/**
 * Local development server that mimics Vercel's routing.
 * In production, Vercel handles routing via vercel.json.
 * Run locally with: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;

// Load .env file if it exists
try {
    const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && !key.startsWith('#') && val.length) {
            process.env[key.trim()] = val.join('=').trim();
        }
    });
} catch (e) { /* No .env file, use system env */ }

// Initialize default admin password if needed
const { readSettings, writeSettings } = require('./api/_lib/db');
const { hashPassword } = require('./api/_lib/auth');

(function initAdmin() {
    const settings = readSettings();
    if (settings.adminPassword === '$2a$10$placeholder') {
        settings.adminPassword = hashPassword('umiumi2026');
        writeSettings(settings);
        console.log('✿ Default admin password set: umiumi2026');
    }
})();

// MIME types
const MIME = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function serveFile(res, filepath) {
    if (!fs.existsSync(filepath)) return false;
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) filepath = path.join(filepath, 'index.html');
    if (!fs.existsSync(filepath)) return false;
    const mime = MIME[path.extname(filepath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filepath).pipe(res);
    return true;
}

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', c => { body += c; });
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve({}); }
        });
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });
        return res.end();
    }

    // API routes — resolve to serverless functions
    if (pathname.startsWith('/api/')) {
        const body = await parseBody(req);

        // Build the mock req/res for Vercel-style handlers
        const mockReq = {
            method: req.method,
            headers: req.headers,
            body,
            query: {},
        };

        // Parse query params from URL path segments (e.g. [id])
        const queryParams = Object.fromEntries(url.searchParams.entries());
        mockReq.query = queryParams;

        const mockRes = {
            statusCode: 200,
            _headers: { 'Content-Type': 'application/json' },
            status(code) { this.statusCode = code; return this; },
            setHeader(key, val) { this._headers[key] = val; },
            json(data) {
                res.writeHead(this.statusCode, this._headers);
                res.end(JSON.stringify(data));
            },
        };

        // Resolve handler path
        let handlerPath = pathname.replace('/api/', '');
        let handler = null;

        // Try exact file match first
        const exactPath = path.join(__dirname, 'api', handlerPath + '.js');
        if (fs.existsSync(exactPath)) {
            handler = require(exactPath);
        } else {
            // Try dynamic route: check for [id].js pattern
            const parts = handlerPath.split('/');
            const lastPart = parts.pop();
            const parentDir = path.join(__dirname, 'api', ...parts);
            const dynamicPath = path.join(parentDir, '[id].js');

            if (fs.existsSync(dynamicPath)) {
                mockReq.query.id = lastPart;
                handler = require(dynamicPath);
            } else {
                // Try index.js in directory
                const indexPath = path.join(__dirname, 'api', handlerPath, 'index.js');
                if (fs.existsSync(indexPath)) {
                    handler = require(indexPath);
                }
            }
        }

        if (handler) {
            try {
                await handler(mockReq, mockRes);
            } catch (err) {
                console.error('API Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
        return;
    }

    // Static files
    if (pathname.startsWith('/uploads/')) {
        if (serveFile(res, path.join(__dirname, pathname))) return;
    }

    if (pathname.startsWith('/admin')) {
        const file = pathname === '/admin' || pathname === '/admin/'
            ? path.join(__dirname, 'public/admin/index.html')
            : path.join(__dirname, 'public/admin', pathname.replace('/admin/', ''));
        if (serveFile(res, file)) return;
        if (serveFile(res, path.join(__dirname, 'public/admin/index.html'))) return;
    }

    // Store files
    const storeFile = path.join(__dirname, 'public/store', pathname === '/' ? 'index.html' : pathname);
    if (serveFile(res, storeFile)) return;

    // Fallback
    serveFile(res, path.join(__dirname, 'public/store/index.html'));
});

server.listen(PORT, () => {
    console.log(`\n🌊 Umi Umi dev server running on http://localhost:${PORT}`);
    console.log(`   Storefront: http://localhost:${PORT}`);
    console.log(`   Admin:      http://localhost:${PORT}/admin`);
    console.log(`\n✿ Default admin password: umiumi2026`);
    console.log(`\n💳 PayPal: ${process.env.PAYPAL_CLIENT_ID ? 'Configured ✓' : 'Not configured (add .env file)'}\n`);
});
