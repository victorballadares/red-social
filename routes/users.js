const express = require('express');
const router = express.Router();

const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.js');
const transporter = require('../config/mailer');
const auth = require('../config/auth');

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
    }
);

router.get('/signup', (req, res, next) => {
    res.render('signup', {
        error: req.flash("error"),
    });
});

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/', failureFlash: true }),
    (req, res) => {
        const user = new User(req.user);
        req.login(user, { session: false }, async(err) => {
            if (err) return next(err);
            const body = { _id: user._id, username: user.username };
            const token = jwt.sign({ user: body }, process.env.SECRET);
            return res.cookie('token', token).redirect('/main');
        });
    }
);

router.get('/google',
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/user.phonenumbers.read'
        ]
    })
);

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

router.get('/forgotpassword', async(req, res, next) => {
    res.render('forgotpassword');
});

//rivasroller35@gmail.com
//qlnlorcpywhygaur

router.post('/forgotpassword', async(req, res, next) => {
    User.find({ email: req.body.email }, async function(err, user) {
        if (user.length > 0) {
            const body = { _id: user[0]._id, username: user[0].username };
            const rtoken = jwt.sign(body, process.env.RSECRET, { expiresIn: '3600s' });
            const route = `http://localhost/users/recoverypassword/${rtoken}`;
            await transporter.sendMail({
                from: '"Forgot password" <no-reply@rivasroller.com>',
                to: req.body.email,
                subject: 'Forgot password',
                html: `<h1>Recovery password</h1><p>Use this <a href="${route}">link</a> to reset your password. This link expired in 1 hour.</p>`
            });
        }
        res.render('templates/message', { msg: 'If your email is registered in our database, we will send you a recovery email.' });
    });
});

router.get('/recoverypassword/:rtoken', async(req, res, next) => {
    res.render('recoverypassword', { rtoken: req.params.rtoken });
});

router.post('/recoverypassword/:rtoken', async(req, res, next) => {
    try {
        const payload = jwt.verify(req.params.rtoken, process.env.RSECRET);
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(req.body.password, salt, 10000, 512, 'sha512').toString('hex');
        await User.findByIdAndUpdate({ _id: payload._id }, { salt: salt, hash: hash }, { new: true });
        req.flash('error', 'Password changed succesfully.');
        res.redirect('/');
    } catch (error) {
        console.log(error)
        res.render('templates/message', { msg: 'Expired link' });
    }
});

router.get('/signout', (req, res, next) => {
    res.send('respond with a resource');
});

module.exports = router;