const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const mongoose = require('mongoose');
const User = mongoose.model('User');

passport.use('signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, async(username, password, done) => {
    await User.findOne({ username: username }).then((user) => {
        if (!user || !user.validPassword(password)) {
            return done(null, false, { message: 'Incorrect username or password.' });
        }
        return done(null, user);
    }).catch(done);
}));

passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost/users/google/callback',
    passReqToCallback: true
}, async(request, accessToken, refreshToken, profile, done) => {
    User.find({ email: profile.email }, async function(err, user) {
        if (user.length > 0) { return done(null, user) };
        newUser = new User({ email: profile.email, username: profile.email.substring(0, profile.email.lastIndexOf("@")), img: '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' });
        newUser.setPassword(profile.id);
        await newUser.save();
        User.find({ email: profile.email }, async function(err, user) {
            return done(null, user);
        });
    });
}));

passport.serializeUser((user, done) => {
    done(null, user)
});

passport.deserializeUser((user, done) => {
    done(null, user)
});