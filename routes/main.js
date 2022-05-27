var express = require('express');
var router = express.Router();
const auth = require('../config/auth');

/* GET home page. */
router.get('/', auth, (req, res, next) => {
    res.render('main');
});

router.get('/post', auth, (req, res, next) => {
    res.render('publish', {
        error: req.flash("error"),
    });
});

router.post('/post', auth, (req, res, next) => {
    res.render('main');
});

module.exports = router;