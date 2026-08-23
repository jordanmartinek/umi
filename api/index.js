/**
 * Single serverless function that handles ALL API routes.
 * This keeps us under Vercel's 12-function Hobby plan limit.
 */

const crypto = require('crypto');
const { getAuth, verifyPassword, hashPassword, createToken } = require('./_lib/auth');
const { readData, writeData, readSettings, writeSettings } = require('./_lib/db');
const { createOrder, captureOrder } = require('./_lib/paypal');

module.exports = async (req, res) => {
    // Parse the route from the URL
    // On Vercel with rewrites, use x-vercel-rewrite-path or the original URL
    // req.url may be /api or /api/paypal/client-id depending on config
    const originalUrl = req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'] || req.url || '/';
    const url = new URL(originalUrl, `https://${req.headers.host || 'localhost'}`);
    let pathname = url.pathname;
    
    // Strip /api prefix to get the route
    if (pathname.startsWith('/api/')) {
        pathname = pathname.slice(4); // remove "/api"
    } else if (pathname === '/api') {
        pathname = '/';
    } else if (pathname.startsWith('/api')) {
        pathname = pathname.slice(4);
    }
    
    // Ensure pathname starts with /
    if (!pathname.startsWith('/')) pathname = '/' + pathname;
    
    // On Vercel rewrites, path params may be in query
    if (pathname === '/' && req.query && req.query.path) {
        const queryPath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
        pathname = '/' + queryPath;
    }
    
    const method = req.method;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        // Debug route — check what the function receives
        if (pathname === '/debug' && method === 'GET') {
            return res.status(200).json({
                rawUrl: req.url,
                originalUrl: req.headers['x-forwarded-uri'] || 'not set',
                invokePath: req.headers['x-invoke-path'] || 'not set',
                parsedPathname: pathname,
                queryPath: req.query?.path || 'not set',
                paypalConfigured: !!process.env.PAYPAL_CLIENT_ID,
                paypalClientIdLength: (process.env.PAYPAL_CLIENT_ID || '').length,
                mode: process.env.PAYPAL_MODE || 'not set',
            });
        }

        // ============================
        // PUBLIC ROUTES
        // ============================

        if (pathname === '/products' && method === 'GET') {
            const products = readData('products.json').filter(p => p.active);
            return res.status(200).json(products);
        }

        if (pathname === '/categories' && method === 'GET') {
            const categories = readData('categories.json').sort((a, b) => a.order - b.order);
            return res.status(200).json(categories);
        }

        if (pathname === '/settings/public' && method === 'GET') {
            const settings = readSettings();
            return res.status(200).json({
                storeName: settings.storeName,
                promoCode: settings.promoCode,
                promoDiscount: settings.promoDiscount,
                freeShippingThreshold: settings.freeShippingThreshold,
                announcementText: settings.announcementText,
            });
        }

        // ============================
        // PAYPAL ROUTES
        // ============================

        if (pathname === '/paypal/client-id' && method === 'GET') {
            return res.status(200).json({
                clientId: process.env.PAYPAL_CLIENT_ID || '',
                mode: process.env.PAYPAL_MODE || 'sandbox',
            });
        }

        if (pathname === '/paypal/create-order' && method === 'POST') {
            const { items } = req.body || {};
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'No items provided' });
            }

            const products = readData('products.json');
            const validatedItems = items.map(item => {
                const product = products.find(p => p.name === item.name && p.active);
                if (!product) throw new Error(`Product not found: ${item.name}`);
                return { name: product.name, price: product.price, quantity: item.quantity || 1 };
            });

            const total = validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const order = await createOrder(validatedItems, total);
            return res.status(200).json({ id: order.id, status: order.status });
        }

        if (pathname === '/paypal/capture-order' && method === 'POST') {
            const { orderID, items } = req.body || {};
            if (!orderID) return res.status(400).json({ error: 'No order ID provided' });

            const captureData = await captureOrder(orderID);

            if (captureData.status === 'COMPLETED') {
                const orders = readData('orders.json');
                const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];

                const newOrder = {
                    id: `order_${crypto.randomUUID().slice(0, 8)}`,
                    paypalOrderId: orderID,
                    paypalCaptureId: capture?.id || null,
                    status: 'paid',
                    items: items || [],
                    total: parseFloat(capture?.amount?.value || 0),
                    currency: capture?.amount?.currency_code || 'USD',
                    payer: {
                        email: captureData.payer?.email_address || '',
                        name: `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`.trim(),
                    },
                    shipping: captureData.purchase_units?.[0]?.shipping || null,
                    createdAt: new Date().toISOString(),
                    fulfilledAt: null,
                };

                orders.push(newOrder);
                writeData('orders.json', orders);
                return res.status(200).json({ success: true, orderId: newOrder.id, status: captureData.status });
            } else {
                return res.status(400).json({ success: false, status: captureData.status, error: 'Payment not completed' });
            }
        }

        // ============================
        // AUTH ROUTES
        // ============================

        if (pathname === '/auth/login' && method === 'POST') {
            const { password } = req.body || {};
            const settings = readSettings();
            if (!verifyPassword(password || '', settings.adminPassword)) {
                return res.status(401).json({ error: 'Invalid password' });
            }
            const token = createToken({ role: 'admin' });
            res.setHeader('Set-Cookie', `umi_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
            return res.status(200).json({ success: true });
        }

        if (pathname === '/auth/logout' && method === 'POST') {
            res.setHeader('Set-Cookie', 'umi_token=; HttpOnly; Path=/; Max-Age=0');
            return res.status(200).json({ success: true });
        }

        if (pathname === '/auth/check' && method === 'GET') {
            const auth = getAuth(req);
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });
            return res.status(200).json({ authenticated: true });
        }

        if (pathname === '/auth/change-password' && method === 'POST') {
            const auth = getAuth(req);
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });

            const { currentPassword, newPassword } = req.body || {};
            const settings = readSettings();
            if (!verifyPassword(currentPassword || '', settings.adminPassword)) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
            settings.adminPassword = hashPassword(newPassword);
            writeSettings(settings);
            return res.status(200).json({ success: true });
        }

        // ============================
        // ADMIN ROUTES (auth required)
        // ============================

        const auth = getAuth(req);

        // Admin: Products
        if (pathname === '/admin/products' && method === 'GET') {
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });
            return res.status(200).json(readData('products.json'));
        }

        if (pathname === '/admin/products' && method === 'POST') {
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });
            const products = readData('products.json');
            const { name, description, price, category, badge, gradient, emoji, active, image } = req.body || {};

            const newProduct = {
                id: `prod_${crypto.randomUUID().slice(0, 8)}`,
                name: name || '',
                description: description || '',
                price: parseFloat(price) || 0,
                category: category || '',
                badge: badge || '',
                image: image || null,
                gradient: gradient || 'linear-gradient(160deg, #E0F5F0 0%, #C8E6E0 50%, #E8B4B8 100%)',
                emoji: emoji || '✿',
                active: active !== 'false' && active !== false,
                createdAt: new Date().toISOString(),
            };

            products.push(newProduct);
            writeData('products.json', products);
            return res.status(201).json(newProduct);
        }

        // Admin: Product by ID
        const productMatch = pathname.match(/^\/admin\/products\/([^/]+)$/);
        if (productMatch) {
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });
            const id = productMatch[1];

            if (method === 'PUT') {
                const products = readData('products.json');
                const index = products.findIndex(p => p.id === id);
                if (index === -1) return res.status(404).json({ error: 'Product not found' });

                const { name, description, price, category, badge, gradient, emoji, active, image } = req.body || {};
                products[index] = {
                    ...products[index],
                    name: name || products[index].name,
                    description: description !== undefined ? description : products[index].description,
                    price: price ? parseFloat(price) : products[index].price,
                    category: category !== undefined ? category : products[index].category,
                    badge: badge !== undefined ? badge : products[index].badge,
                    gradient: gradient || products[index].gradient,
                    emoji: emoji !== undefined ? emoji : products[index].emoji,
                    active: active !== undefined ? (active !== 'false' && active !== false) : products[index].active,
                    image: image !== undefined ? image : products[index].image,
                };
                writeData('products.json', products);
                return res.status(200).json(products[index]);
            }

            if (method === 'DELETE') {
                let products = readData('products.json');
                if (!products.find(p => p.id === id)) return res.status(404).json({ error: 'Product not found' });
                products = products.filter(p => p.id !== id);
                writeData('products.json', products);
                return res.status(200).json({ success: true });
            }
        }

        // Admin: Categories
        if (pathname === '/admin/categories' && method === 'GET') {
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });
            return res.status(200).json(readData('categories.json').sort((a, b) => a.order - b.order));
        }

        if (pathname === '/admin/categories' && method === 'POST') {
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });
            const categories = readData('categories.json');
            const { name } = req.body || {};
            const slug = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const newCategory = { id: `cat_${crypto.randomUUID().slice(0, 8)}`, name, slug, order: categories.length + 1 };
            categories.push(newCategory);
            writeData('categories.json', categories);
            return res.status(201).json(newCategory);
        }

        // Admin: Category by ID
        const categoryMatch = pathname.match(/^\/admin\/categories\/([^/]+)$/);
        if (categoryMatch) {
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });
            const id = categoryMatch[1];

            if (method === 'PUT') {
                const categories = readData('categories.json');
                const index = categories.findIndex(c => c.id === id);
                if (index === -1) return res.status(404).json({ error: 'Category not found' });
                const { name, order } = req.body || {};
                if (name) {
                    categories[index].name = name;
                    categories[index].slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                }
                if (order !== undefined) categories[index].order = order;
                writeData('categories.json', categories);
                return res.status(200).json(categories[index]);
            }

            if (method === 'DELETE') {
                let categories = readData('categories.json');
                categories = categories.filter(c => c.id !== id);
                writeData('categories.json', categories);
                return res.status(200).json({ success: true });
            }
        }

        // Admin: Orders
        if (pathname === '/admin/orders' && method === 'GET') {
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });
            const orders = readData('orders.json');
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return res.status(200).json(orders);
        }

        // Admin: Order by ID
        const orderMatch = pathname.match(/^\/admin\/orders\/([^/]+)$/);
        if (orderMatch) {
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });
            const id = orderMatch[1];

            if (method === 'PUT') {
                const orders = readData('orders.json');
                const index = orders.findIndex(o => o.id === id);
                if (index === -1) return res.status(404).json({ error: 'Order not found' });
                const { status, fulfilledAt } = req.body || {};
                if (status) orders[index].status = status;
                if (status === 'fulfilled' && !orders[index].fulfilledAt) {
                    orders[index].fulfilledAt = new Date().toISOString();
                }
                if (fulfilledAt) orders[index].fulfilledAt = fulfilledAt;
                writeData('orders.json', orders);
                return res.status(200).json(orders[index]);
            }
        }

        // Admin: Settings
        if (pathname === '/admin/settings' && method === 'GET') {
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });
            const settings = readSettings();
            const { adminPassword, ...publicSettings } = settings;
            return res.status(200).json(publicSettings);
        }

        if (pathname === '/admin/settings' && method === 'PUT') {
            if (!auth) return res.status(401).json({ error: 'Unauthorized' });
            const settings = readSettings();
            const { storeName, promoCode, promoDiscount, freeShippingThreshold, announcementText } = req.body || {};
            if (storeName !== undefined) settings.storeName = storeName;
            if (promoCode !== undefined) settings.promoCode = promoCode;
            if (promoDiscount !== undefined) settings.promoDiscount = promoDiscount;
            if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = freeShippingThreshold;
            if (announcementText !== undefined) settings.announcementText = announcementText;
            writeSettings(settings);
            return res.status(200).json(settings);
        }

        // Not found
        return res.status(404).json({ error: 'Not found' });

    } catch (err) {
        console.error('API Error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
};
