var express = require('express');
var router = express.Router();
const imageToBase64 = require('image-to-base64');
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

router.post('/post', [multer.single('fname')], async(req, res, next) => {
    const title = req.body.title;
    let { filepath } = await storeWithOriginalName(req.file);
    let imgbs64;
    await imageToBase64(filepath).then((img) => { imgbs64 = img; }).catch((error) => { console.log(error); });
    fs.unlink(filepath, () => {});
    res.send(`<img src="data:image/png;base64,${imgbs64}">`);
});

function storeWithOriginalName(file) {
    var fullNewPath = path.join(file.destination, file.originalname)
    fs.renameSync(file.path, fullNewPath)

    return {
        filepath: fullNewPath
    }
}

module.exports = router;