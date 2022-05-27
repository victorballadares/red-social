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
        newUser = new User({ email: profile.email, username: profile.email.substring(0, profile.email.lastIndexOf("@")) });
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