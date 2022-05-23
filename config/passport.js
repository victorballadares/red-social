const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
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

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});