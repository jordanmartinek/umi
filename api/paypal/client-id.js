module.exports = (req, res) => {
    // Expose only the client ID (safe for frontend) and the mode
    res.status(200).json({
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        mode: process.env.PAYPAL_MODE || 'sandbox',
    });
};
