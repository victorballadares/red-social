const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    username: { type: String, lowercase: true, unique: true, required: [true, "cant be blank."], match: [/^[a-zA-Z0-9\.]+$/, 'not valid.'], index: true },
    email: { type: String, lowercase: true, unique: true, required: [true, "cant be blank."], match: [/\S+@\S+\.\S+/, 'not valid.'], index: true },
    phone: { type: String },
    hash: String,
    salt: String,
    follows: [String],
    img: String
}, { timestamps: true });

UserSchema.plugin(uniqueValidator, { message: 'in use.' });

UserSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.validPassword = function(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

UserSchema.methods.changePassword = async function(_id, password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    await UserSchema.findByIdAndUpdate({ _id: _id }, { salt: salt, hash: hash }, { new: true });
};

module.exports = mongoose.model('User', UserSchema);