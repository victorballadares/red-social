var express = require('express');
var router = express.Router();
const imageToBase64 = require('image-to-base64');
const auth = require('../config/auth');
const Post = require('../models/Post.js');
const User = require('../models/User.js');

const multer = require('multer')({
    dest: 'public/images/posts'
});
const fs = require('fs');
const path = require('path');

/* GET home page. */
router.get('/', auth, (req, res, next) => {
    res.render('main', {
        error: req.flash("error"),
    });
});

router.get('/post', auth, (req, res, next) => {
    res.render('post', {
        error: req.flash("error"),
    });
});

router.post('/post', [multer.single('fname')], async(req, res, next) => {
    try {
        const title = req.body.title;
        let { filepath } = await storeWithOriginalName(req.file);
        let imgbs64;
        await imageToBase64(filepath).then((img) => { imgbs64 = img; }).catch((error) => { console.log(error); });
        fs.unlink(filepath, async() => {
            const post = new Post({
                img: imgbs64,
                title: title,
                date: Date.now()
            });
            await post.save();
            req.flash('error', 'Password changed succesfully.');
            res.redirect('/main');
        });
    } catch (error) {
        req.flash('error', 'Something has gone wrong.');
        res.redirect('/main');
    }
});

router.get('/follow/:_id', auth, async(req, res, next) => {
    await User.findOneAndUpdate({ _id: req.params._id }, { $addToSet: { follows: req.user.user._id } });
    res.send('');
});

router.get('/unfollow/:_id', auth, async(req, res, next) => {
    await User.findOneAndUpdate({ _id: req.params._id, follows: req.user.user._id }, { $pull: { follows: req.user.user._id } });
    res.send('');
});

router.get('/search/:query', auth, auth, async(req, res, next) => {
    let users = [];
    let posts = [];
    User.find({ username: { "$regex": req.params.query, "$options": "i" } }, (err, user) => {
        for (const key in user) {
            const fuser = user[key];
            users.push({ _id: fuser._id, username: fuser.username });
        }
        Post.find({ title: { "$regex": req.params.query, "$options": "i" } }, (err, post) => {
            for (const key in post) {
                const fpost = post[key];
                posts.push(fpost);
            }
            res.json({ users, post });
        });
    });
});

function storeWithOriginalName(file) {
    var fullNewPath = path.join(file.destination, file.originalname)
    fs.renameSync(file.path, fullNewPath)

    return {
        filepath: fullNewPath
    }
}

module.exports = router;