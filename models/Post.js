const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    img: String,
    title: String,
    likes: {},
    comments: {},
    date: String
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);