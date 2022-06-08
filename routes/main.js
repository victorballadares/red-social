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
router.get('/', auth, async(req, res, next) => {
    let posts = [];
    User.find({ $or: [{ follows: req.user.user._id }, { _id: req.user.user._id }] }, { salt: 0, hash: 0 }).populate('posts').exec((err, user) => {
        for (const key in user) {
            user[key].posts.forEach(post => {
                let ago = '';
                const date = new Date(post.date);
                const dif = new Date() - date;
                const segs = 1000;
                const mins = segs * 60;
                const hours = mins * 60;
                const days = hours * 24;
                if (dif / days < 3) {
                    if (dif / days > 1) {
                        ago = Math.floor(dif / days) + ' days ago';
                    } else if (dif / hours > 1) {
                        ago = Math.floor(dif / hours) + ' hours ago';
                    } else if (dif / mins > 1) {
                        ago = Math.floor(dif / mins) + ' mins ago';
                    } else if (dif / segs > 1) {
                        ago = Math.floor(dif / segs) + ' segs ago';
                    }
                } else {
                    ago = date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear();
                }
                posts.push({ _id: user[key]._id, username: user[key].username, img: user[key].img, post: post, ago: ago });
            });
        }
        posts.sort(function(a, b) {
            return b.post.date - a.post.date;
        });
        const _id = req.user.user._id;
        //console.log(posts)
        res.render('main', {
            error: req.flash("error"),
            posts,
            _id
        });
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
            const savedPost = await post.save();
            await User.findOneAndUpdate({ _id: req.user.user._id }, { $push: { posts: savedPost._id } });
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
    res.redirect('/main/profile/' + req.params._id);
});

//Función para dejar de seguir
router.get('/unfollow/:_id', auth, async(req, res, next) => {
    await User.findOneAndUpdate({ _id: req.params._id, follows: req.user.user._id }, { $pull: { follows: req.user.user._id } });
    res.redirect('/main/profile/' + req.params._id);
});

//Función para dar likes
router.get('/like/:_id', auth, async(req, res, next) => {
    await Post.findOneAndUpdate({ _id: req.params._id }, { $addToSet: { likes: req.user.user._id } });
    res.status(200).send();
});

//Función para dejar de seguir
router.get('/unlike/:_id', auth, async(req, res, next) => {
    await Post.findOneAndUpdate({ _id: req.params._id, likes: req.user.user._id }, { $pull: { likes: req.user.user._id } });
    res.status(200).send();
});

//Funcion que busca usuario o post con ese valor indicado
router.get('/search/:query', auth, async(req, res, next) => {
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


router.get('/profile/me', auth, async(req, res, next) => {
    const user = await User.findById(req.user.user._id, { salt: 0, hash: 0 }).populate('posts');
    res.render('profile', { user, _id: req.user.user._id });
});

//Busca el perfil del usuario 
router.get('/profile/:_id', auth, async(req, res, next) => {
    if (req.params._id == req.user.user._id) res.redirect('/main/profile/me');
    const user = await User.findById(req.params._id, { salt: 0, hash: 0 }).populate('posts');
    res.render('profile', { user, _id: req.user.user._id });
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