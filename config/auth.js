const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const token = req.cookies['token'];
    if (!token) {
        res.redirect('/');
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.user = decoded;
        return next();
    } catch (err) {
        res.redirect('/');
    }
};

module.exports = verifyToken;