const { getAuth } = require('../../_lib/auth');
const { readData, writeData } = require('../../_lib/db');

module.exports = (req, res) => {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.query;

    if (req.method === 'PUT') {
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

    if (req.method === 'DELETE') {
        let categories = readData('categories.json');
        categories = categories.filter(c => c.id !== id);
        writeData('categories.json', categories);
        return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
};
