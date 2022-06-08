//Se crea el modelo de la tabla comments
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, //Agarramos el id del usuario
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }], //Array de objetos que contiene el id de la persona que dan like
    comment: String, //El comentario
    date: Number //Fecha de publicación
}, { timestamps: true });

//Exportamos la schema 
module.exports = mongoose.model('Comment', CommentSchema);