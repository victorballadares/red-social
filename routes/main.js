var express = require('express');
var router = express.Router();
const auth = require('../config/auth');

const multer = require('multer')({
    dest: 'public/images/posts'
});
const fs = require('fs');
const path = require('path');

/* GET home page. */
router.get('/', auth, (req, res, next) => {
    res.render('main');
});

router.get('/post', auth, (req, res, next) => {
    res.render('post', {
        error: req.flash("error"),
    });
});

router.post('/post', [multer.single('fname')], (req, res, next) => {
    console.log(req.file)
    const title = req.body.title;
    let { filepath, filename } = storeWithOriginalName(req.file);
    let file;
    fs.readFile(filepath, function read(err, data) {
        if (err) {
            throw err;
        }
        file = data;
    });
    res.send('post');
});

function storeWithOriginalName(file) {
    var fullNewPath = path.join(file.destination, file.originalname)
    fs.renameSync(file.path, fullNewPath)

    return {
        filepath: fullNewPath,
        filename: file.originalname,
    }
}

module.exports = router;