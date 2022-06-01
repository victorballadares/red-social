//Se crea el modelo de la tabla post
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user: mongoose.ObjectId, //Agarramos el id del usuario
    img: String,             //Guardamos el base64 de la imagen
    title: String,           //Obtenemos el pie  de publicación
    likes: [],               //Array de objetos que contiene el id de la persona que doy like
    comments: [],            //Array de objetos que contiene el id de la persona que esta comentado y el comentario
    date: String             //Fecha de publicación
}, { timestamps: true });    

//Exportamos la schema 
module.exports = mongoose.model('Post', PostSchema);