const express = require('express');
const router = express.Router();

const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

/* GET users listing. */



router.post('/signin',
    passport.authenticate('signin', { failureRedirect: '/', failureFlash: true }),
    (req, res) => {
        const user = new User(req.user);
        req.login(user, { session: false }, async(err) => {
            if (err) return next(err);
            const body = { _id: user._id, username: user.username };
            const token = jwt.sign({ user: body }, process.env.SECRET);
            return res.cookie('token', token).redirect('/main');
        });
    });

router.get('/signup', (req, res, next) => {
    res.render('signup', {
        error: req.flash("error"),
    });
});

router.post('/signup', async(req, res, next) => {
    let info = {
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone,
    }
    try {
        const user = await new User(info);
        await user.setPassword(req.body.password);
        await user.save();
        res.redirect('/');
    } catch (err) {
        //const message = err.errors[0].path + ' ' + err.errors[0].ValidatorError;
        for (const key in err.errors) {
            if (Object.hasOwnProperty.call(err.errors, key)) {
                const element = err.errors[key];
                req.flash('error', element.properties.path + ' ' + element.properties.message);
            }
        }
        res.redirect('/users/signup');
    }
});

router.get('/signout', (req, res, next) => {
    res.send('respond with a resource');
});

module.exports = router;