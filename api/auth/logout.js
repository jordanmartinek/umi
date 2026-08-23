module.exports = (req, res) => {
    res.setHeader('Set-Cookie', 'umi_token=; HttpOnly; Path=/; Max-Age=0');
    res.status(200).json({ success: true });
};
