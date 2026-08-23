const { getAuth } = require('../_lib/auth');
const { readData, writeData } = require('../_lib/db');
const crypto = require('crypto');

module.exports = (req, res) => {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
        const categories = readData('categories.json').sort((a, b) => a.order - b.order);
        return res.status(200).json(categories);
    }

    if (req.method === 'POST') {
        const categories = readData('categories.json');
        const { name } = req.body || {};
        const slug = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const newCategory = {
            id: `cat_${crypto.randomUUID().slice(0, 8)}`,
            name,
            slug,
            order: categories.length + 1,
        };

        categories.push(newCategory);
        writeData('categories.json', categories);
        return res.status(201).json(newCategory);
    }

    res.status(405).json({ error: 'Method not allowed' });
};
