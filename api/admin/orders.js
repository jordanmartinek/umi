const { getAuth } = require('../_lib/auth');
const { readData, writeData } = require('../_lib/db');

module.exports = (req, res) => {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
        const orders = readData('orders.json');
        // Sort newest first
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return res.status(200).json(orders);
    }

    res.status(405).json({ error: 'Method not allowed' });
};
