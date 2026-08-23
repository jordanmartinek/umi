const { readSettings } = require('../_lib/db');

module.exports = (req, res) => {
    const settings = readSettings();
    res.status(200).json({
        storeName: settings.storeName,
        promoCode: settings.promoCode,
        promoDiscount: settings.promoDiscount,
        freeShippingThreshold: settings.freeShippingThreshold,
        announcementText: settings.announcementText,
    });
};
