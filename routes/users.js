const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.js');
const transporter = require('../config/mailer');
const auth = require('../config/auth');
const imageToBase64 = require('image-to-base64');

const multer = require('multer')({ //Usamos la libreria multer para subir la imagen
    dest: 'public/images/posts' //Establecemos el directorio donde se va a guardar
});
const fs = require('fs'); //Se requiere para trabajar la imagen
const path = require('path'); //Se utiliza para trabajar las rutas de los archivos

//Ruta para hacer login
router.post('/signin',
    passport.authenticate('signin', { failureRedirect: '/', failureFlash: true }),
    (req, res) => {
        const user = new User(req.user);
        req.login(user, { session: false }, async(err) => {
            if (err) return next(err);
            const body = { _id: user._id, username: user.username };
            const token = jwt.sign({ user: body }, process.env.SECRET);
            return res.cookie('token', token).redirect('/main');
        });
    }
);

//Ruta para dar de alta en la app
router.get('/signup', (req, res, next) => {
    res.render('signup', {
        error: req.flash("error"), //Para obtener los errores
    });
});

//Para autenticarse con google
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/', failureFlash: true }),
    (req, res) => {
        const user = req.user[0];
        req.login(user, { session: false }, async(err) => {
            if (err) return next(err);
            const body = { _id: user._id, username: user.username };
            const token = jwt.sign({ user: body }, process.env.SECRET);
            return res.cookie('token', token).redirect('/main');
        });
    }
);

//Para abrir el pop up de google
router.get('/google',
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/user.phonenumbers.read'
        ]
    })
);

//Ruta para registrar el usuario en la base de datos
router.post('/signup', async(req, res, next) => {
    if (req.body.password == req.body.rpassword) {
        let info = {
            username: req.body.username,
            email: req.body.email,
            phone: req.body.phone,
            img: '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'
        }
        try {
            const user = await new User(info);
            await user.setPassword(req.body.password);
            await user.save();
            res.redirect('/');
        } catch (err) {
            //const message = err.errors[0].path + ' ' + err.errors[0].ValidatorError;
            for (const key in err.errors) {
                if (Object.hasOwnProperty.call(err.errors, key)) {
                    const element = err.errors[key];
                    req.flash('error', element.properties.path + ' ' + element.properties.message);
                }
            }
            res.redirect('/');
        }
    } else {
        req.flash('error', "Passwords don't macth.");
        res.redirect('/users/signup');
    }
});

//Ruta para solicitar la recuperación del password
router.get('/forgotpassword', async(req, res, next) => {
    res.render('forgotpassword');
});


//La ruta que crea el correo 
router.post('/forgotpassword', async(req, res, next) => {
    User.find({ email: req.body.email }, async function(err, user) {
        if (user.length > 0) {
            const body = { _id: user[0]._id, username: user[0].username };
            const rtoken = jwt.sign(body, process.env.RSECRET, { expiresIn: '3600s' });
            const route = `http://localhost/users/recoverypassword/${rtoken}`; //Se crea la ruta de la recuperación
            await transporter.sendMail({
                from: '"Forgot password" <no-reply@rivasroller.com>',
                to: req.body.email,
                subject: 'Forgot password',
                html: `<h1>Recovery password</h1><p>Use this <a href="${route}">link</a> to reset your password. This link expired in 1 hour.</p>`
            });
        }
        res.render('templates/message', { msg: 'If your email is registered in our database, we will send you a recovery email.' });
    });
});

//Ruta para introducir la nueva contraseña
router.get('/recoverypassword/:rtoken', async(req, res, next) => {
    res.render('recoverypassword', { rtoken: req.params.rtoken, error: req.flash("error") });
});

//Para cambiar la contraseña en la bd
router.post('/recoverypassword/:rtoken', async(req, res, next) => {
    if (req.body.password == req.body.rpassword) {
        try {
            const payload = jwt.verify(req.params.rtoken, process.env.RSECRET);
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(req.body.password, salt, 10000, 512, 'sha512').toString('hex');
            await User.findByIdAndUpdate({ _id: payload._id }, { salt: salt, hash: hash }, { new: true });
            req.flash('error', 'Password changed succesfully.');
            res.redirect('/');
        } catch (error) {
            console.log(error)
            res.render('templates/message', { msg: 'Expired link' });
        }
    } else {
        req.flash('error', "Passwords don't macth.");
        res.redirect('/users/recoverypassword/' + req.params.rtoken);
    }
});

//Para cerrar session 
router.get('/signout', auth, (req, res, next) => {
    res.clearCookie("token").clearCookie("connect.sid").redirect('/');
});

//Para buscar un usuario
router.get('/profile/:_id', async(req, res, next) => {
    const user = User.find(req.params._id);

    res.send('respond with a resource');
});

//Para las herramientas
router.get('/tools', auth, (req, res) => {
    res.render('tools');
});

//Para editar perfil usuario
router.get('/editprofile', auth, (req, res) => {
    res.render('editprofile');
});

//Para cambiar foto del perfil
router.get('/changeimage', auth, (req, res) => {
    res.render('changeimage');
});

router.post('/changeimage', auth, [multer.single('fname')], async(req, res) => {
    let { filepath } = await storeWithOriginalName(req.file); //Mueve y renombra el archivo, se renombre porque el nombre que trae por defecto no nos sirve
    let imgbs64; //Variable que va a tener la base 64 de la imagen
    //Convertimos la imagen en base64 
    await imageToBase64(filepath).then((img) => { imgbs64 = img; }).catch((error) => { console.log(error); });
    fs.unlink(filepath, async() => { //Borramos el archivo
        await User.findOneAndUpdate({ _id: req.user.user._id }, { img: imgbs64 });
        req.flash('error', 'Profile photo changed succesfully.');
        res.redirect('/users/tools');
    });
});

//Para cambiar la password en tools
router.get('/changepassword', auth, (req, res) => {
    res.render('changepassword', {
        error: req.flash("error"), //Para obtener los errores
    });
});

router.post('/changepassword', auth, async(req, res) => {
    if (req.body.password == req.body.rpassword) {
        const user = new User();
        const { salt, hash } = await user.changePassword(req.body.password);
        await User.findByIdAndUpdate({ _id: req.user.user._id }, { salt: salt, hash: hash }, { new: true });
        req.flash('error', 'Password changed succesfully.');
        res.redirect('/users/tools');
    } else {
        req.flash('error', "Passwords don't macth.");
        res.redirect('/users/changepassword');
    }
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