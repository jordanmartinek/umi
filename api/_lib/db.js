/**
 * Data access layer with a pluggable backend.
 *
 *   • PERSISTENT (production / Vercel): Upstash Redis, used automatically when
 *     UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are present. Provision
 *     it in one click from the Vercel Marketplace (Storage → Upstash for Redis)
 *     and those env vars are injected for you. Each collection is stored as a
 *     single JSON value under a "umi:<name>" key, and is seeded from the
 *     committed JSON files the first time it's read so your existing catalog
 *     carries over with no manual import.
 *
 *   • LOCAL FALLBACK (dev): plain JSON files in ../../data, exactly like before.
 *     No setup, no dependencies required to run locally.
 *
 * IMPORTANT: Vercel's serverless filesystem is ephemeral, so writes to the JSON
 * files there do NOT persist. Configure Upstash for any real/hosted store so
 * admin dashboard changes (products, orders, categories, settings) survive.
 *
 * All exported functions are async — callers must `await` them.
 */

const fs = require('fs');
const path = require('path');

// Use __dirname to reliably find data/ regardless of where the function runs.
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Bundled defaults — always available even on a read-only filesystem, and used
// to seed Redis on first run.
const BUNDLED = {
    'products.json': require('../../data/products.json'),
    'categories.json': require('../../data/categories.json'),
    'sets.json': require('../../data/sets.json'),
    'settings.json': require('../../data/settings.json'),
    'orders.json': [],
};

function bundledDefault(filename) {
    const val = BUNDLED[filename];
    if (val === undefined) return [];
    // Return a deep-ish copy so callers can't mutate the module-level default.
    return JSON.parse(JSON.stringify(val));
}

// ---- Backend selection -----------------------------------------------------
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const USE_REDIS = !!(REDIS_URL && REDIS_TOKEN);

let redis = null;
if (USE_REDIS) {
    try {
        const { Redis } = require('@upstash/redis');
        redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
    } catch (e) {
        console.warn('[db] @upstash/redis not available, falling back to files:', e.message);
        redis = null;
    }
}

const REDIS_KEY_PREFIX = 'umi:';
const redisKey = filename => REDIS_KEY_PREFIX + filename.replace(/\.json$/, '');

// ---- Redis-backed read/write ----------------------------------------------
async function redisRead(filename) {
    const key = redisKey(filename);
    let value = await redis.get(key);
    // Missing key → seed from the bundled defaults so the store is never empty.
    if (value === null || value === undefined) {
        const seed = bundledDefault(filename);
        await redis.set(key, seed);
        return seed;
    }
    // @upstash/redis auto-serializes JSON, so `value` is already an object/array.
    // Guard against a value that was stored as a raw string just in case.
    if (typeof value === 'string') {
        try { value = JSON.parse(value); } catch (e) { /* leave as-is */ }
    }
    return value;
}

async function redisWrite(filename, data) {
    await redis.set(redisKey(filename), data);
}

// ---- File-backed read/write (local dev) ------------------------------------
function fileRead(filename) {
    const filepath = path.join(DATA_DIR, filename);
    try {
        if (fs.existsSync(filepath)) {
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        }
    } catch (e) { /* fall through to bundled */ }
    return bundledDefault(filename);
}

function fileWrite(filename, data) {
    const filepath = path.join(DATA_DIR, filename);
    try {
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.warn('Write failed (read-only filesystem):', filename);
    }
}

// ---- Public API (async) ----------------------------------------------------
async function readData(filename) {
    return USE_REDIS && redis ? redisRead(filename) : fileRead(filename);
}

async function writeData(filename, data) {
    if (USE_REDIS && redis) return redisWrite(filename, data);
    return fileWrite(filename, data);
}

async function readSettings() {
    const settings = await readData('settings.json');
    // readData already falls back to the bundled settings object, but guard
    // against a non-object just in case a bad value was ever stored.
    return settings && typeof settings === 'object' && !Array.isArray(settings)
        ? settings
        : bundledDefault('settings.json');
}

async function writeSettings(settings) {
    return writeData('settings.json', settings);
}

// True when a persistent (Redis) backend is active — handy for diagnostics.
const isPersistent = USE_REDIS && !!redis;

module.exports = {
    readData, writeData, readSettings, writeSettings,
    DATA_DIR, isPersistent,
};
