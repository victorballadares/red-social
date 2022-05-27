var express = require('express');
var router = express.Router();
const auth = require('../config/auth');

/* GET home page. */
router.get('/', auth, function(req, res, next) {
    console.log(req.user)
    res.render('main');
});

module.exports = router;