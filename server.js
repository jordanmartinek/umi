/**
 * Local development server that mimics Vercel's routing.
 * In production, Vercel handles routing via vercel.json.
 * Run locally with: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

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
} catch (e) { /* No .env file */ }

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

// The consolidated API handler
const apiHandler = require('./api/index.js');

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

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // API routes → pass to consolidated handler
    if (pathname.startsWith('/api/') || pathname === '/api') {
        // Parse body
        let body = '';
        await new Promise(resolve => {
            req.on('data', c => { body += c; });
            req.on('end', resolve);
        });

        let parsedBody = {};
        try { parsedBody = JSON.parse(body); } catch (e) {}

        // Mock Vercel-style req/res
        const mockReq = {
            method: req.method,
            url: req.url,
            headers: Object.fromEntries(
                Object.entries(req.headers).map(([k, v]) => [k, v])
            ),
            body: parsedBody,
        };
        // Add .get() method for headers compatibility
        mockReq.headers.get = (key) => mockReq.headers[key.toLowerCase()] || '';

        const mockRes = {
            statusCode: 200,
            _headers: {},
            setHeader(key, val) { this._headers[key] = val; },
            status(code) { this.statusCode = code; return this; },
            json(data) {
                res.writeHead(this.statusCode, { 'Content-Type': 'application/json', ...this._headers });
                res.end(JSON.stringify(data));
            },
            end() { res.writeHead(this.statusCode, this._headers); res.end(); },
        };

        try {
            await apiHandler(mockReq, mockRes);
        } catch (err) {
            console.error('API Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
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
    const storeFile = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    if (serveFile(res, storeFile)) return;

    // Fallback
    serveFile(res, path.join(__dirname, 'public/index.html'));
});

server.listen(PORT, () => {
    console.log(`\n🌊 Umi Umi dev server running on http://localhost:${PORT}`);
    console.log(`   Storefront: http://localhost:${PORT}`);
    console.log(`   Admin:      http://localhost:${PORT}/admin`);
    console.log(`\n✿ Default admin password: umiumi2026`);
    console.log(`💳 PayPal: ${process.env.PAYPAL_CLIENT_ID ? 'Configured ✓' : 'Not configured (add .env file)'}\n`);
});
