const express = require('express');
const router = express.Router();
const imageToBase64 = require('image-to-base64');
const auth = require('../config/auth');
const Post = require('../models/Post.js');
const User = require('../models/User.js');

const multer = require('multer')({ //Usamos la libreria multer para subir la imagen
    dest: 'public/images/posts' //Establecemos el directorio donde se va a guardar
});
const fs = require('fs'); //Se requiere para trabajar la imagen
const path = require('path'); //Se utiliza para trabajar las rutas de los archivos

//Ruta principal de main
router.get('/', auth, (req, res, next) => {
    res.render('main', {
        error: req.flash("error"),
    });
});

//Ruta para subir un post
router.get('/post', auth, (req, res, next) => {
    res.render('post', {
        error: req.flash("error"),
    });
});

router.post('/post', auth, [multer.single('fname')], async(req, res, next) => { //Ruta donde se trabaja el post
    try {
        const title = req.body.title; //Pie de la imagen
        let { filepath } = await storeWithOriginalName(req.file); //Mueve y renombra el archivo, se renombre porque el nombre que trae por defecto no nos sirve
        let imgbs64; //Variable que va a tener la base 64 de la imagen
        //Convertimos la imagen en base64 
        await imageToBase64(filepath).then((img) => { imgbs64 = img; }).catch((error) => { console.log(error); });
        fs.unlink(filepath, async() => { //Borramos el archivo
            //Creamos el objeto post
            const post = new Post({
                user: req.user.user._id,
                img: imgbs64,
                title: title,
                date: Date.now()
            });
            await post.save();
            req.flash('error', 'Post created succesfully.');
            res.redirect('/main');
        });
    } catch (error) {
        req.flash('error', 'Something has gone wrong.');
        res.redirect('/main');
    }
});

//Función para seguir
router.get('/follow/:_id', auth, async(req, res, next) => {
    await User.findOneAndUpdate({ _id: req.params._id }, { $addToSet: { follows: req.user.user._id } });
    res.send('');
});

//Función para dejar de seguir
router.get('/unfollow/:_id', auth, async(req, res, next) => {
    await User.findOneAndUpdate({ _id: req.params._id, follows: req.user.user._id }, { $pull: { follows: req.user.user._id } });
    res.send('');
});

//Funcion que busca usuario o post con ese valor indicado
router.get('/search/:query', auth, auth, async(req, res, next) => {
    let users = [];
    let posts = [];
    User.find({ username: { "$regex": req.params.query, "$options": "i" } }, (err, user) => {
        for (const key in user) {
            const fuser = user[key];
            users.push({ _id: fuser._id, username: fuser.username, img: fuser.img });
        }
        Post.find({ title: { "$regex": req.params.query, "$options": "i" } }, (err, post) => {
            for (const key in post) {
                const fpost = post[key];
                posts.push(fpost);
            }
            res.render('search', { users, posts });
        });
    });
});

//Busca el perfil del usuario (FALTA)
router.get('/profile/:_id', auth, (req, res, next) => {
    let data = [];
    Post.find({ user: req.params._id }, (err, post) => {
        data.push(post);
        User.find({ _id: req.params._id }, (err, user) => {
            if (user.length > 0) {
                let fuser = {
                    _id: user[0]._id,
                    username: user[0].username,
                    img: user[0].img,
                    follows: user[0].follows,
                };
                data.push(fuser);
                res.render('profile', { data });
            }
        });
    });
});

//Función para mover y renombrar la imagen
function storeWithOriginalName(file) {
    var fullNewPath = path.join(file.destination, file.originalname)
    fs.renameSync(file.path, fullNewPath)

    return {
        filepath: fullNewPath
    }
}

module.exports = router;