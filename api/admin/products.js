const { getAuth } = require('../_lib/auth');
const { readData, writeData } = require('../_lib/db');
const crypto = require('crypto');

module.exports = (req, res) => {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
        return res.status(200).json(readData('products.json'));
    }

    if (req.method === 'POST') {
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

    res.status(405).json({ error: 'Method not allowed' });
};
