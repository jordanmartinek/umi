const fs = require('fs');
const path = require('path');

// Use __dirname to reliably find data/ regardless of where the function runs
// On Vercel: __dirname is inside the function bundle
// Locally: __dirname is /project/api/_lib, so go up 2 levels
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Fallback: read from bundled JSON if filesystem path doesn't exist
// This ensures data is available even on Vercel's read-only filesystem
const BUNDLED_PRODUCTS = require('../../data/products.json');
const BUNDLED_CATEGORIES = require('../../data/categories.json');
const BUNDLED_SETTINGS = require('../../data/settings.json');

function readData(filename) {
    const filepath = path.join(DATA_DIR, filename);
    try {
        if (fs.existsSync(filepath)) {
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        }
    } catch (e) { /* fall through to bundled */ }
    
    // Fallback to bundled data
    if (filename === 'products.json') return [...BUNDLED_PRODUCTS];
    if (filename === 'categories.json') return [...BUNDLED_CATEGORIES];
    if (filename === 'orders.json') return [];
    return [];
}

function writeData(filename, data) {
    const filepath = path.join(DATA_DIR, filename);
    try {
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.warn('Write failed (read-only filesystem):', filename);
    }
}

function readSettings() {
    const filepath = path.join(DATA_DIR, 'settings.json');
    try {
        if (fs.existsSync(filepath)) {
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        }
    } catch (e) { /* fall through */ }
    return { ...BUNDLED_SETTINGS };
}

function writeSettings(settings) {
    const filepath = path.join(DATA_DIR, 'settings.json');
    try {
        fs.writeFileSync(filepath, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.warn('Write failed (read-only filesystem): settings.json');
    }
}

module.exports = { readData, writeData, readSettings, writeSettings, DATA_DIR };
