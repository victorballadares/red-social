//Se crea el modelo de la tabla post
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, //Agarramos el id del usuario
    img: String, //Guardamos el base64 de la imagen
    title: String, //Obtenemos el pie  de publicación
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }], //Array de objetos que contiene el id de la persona que doy like
    comments: [], //Array de objetos que contiene el id de la persona que esta comentado y el comentario
    date: Number //Fecha de publicación
}, { timestamps: true });

//Exportamos la schema 
module.exports = mongoose.model('Post', PostSchema);