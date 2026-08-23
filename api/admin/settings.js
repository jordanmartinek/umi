const { getAuth } = require('../_lib/auth');
const { readSettings, writeSettings } = require('../_lib/db');

module.exports = (req, res) => {
    const auth = getAuth(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
        const settings = readSettings();
        const { adminPassword, ...publicSettings } = settings;
        return res.status(200).json(publicSettings);
    }

    if (req.method === 'PUT') {
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

    res.status(405).json({ error: 'Method not allowed' });
};
