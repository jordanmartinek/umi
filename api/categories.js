const { readData } = require('./_lib/db');

module.exports = (req, res) => {
    const categories = readData('categories.json').sort((a, b) => a.order - b.order);
    res.status(200).json(categories);
};
