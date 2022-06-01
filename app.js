const createError = require('http-errors'); 
const express = require('express'); // Se requiere express para levantar el servidor
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose'); // Se requiere mongoose para conectar la BD al proyecto
const passport = require('passport'); // Se requiere passport para la autenticación
require('dotenv').config(); // Se requiere dotenv para archivo .env
const flash = require('express-flash'); // Se requiere flash para mostrar los errores
const session = require('express-session'); // Se requiere express

//Rutas 
const indexRouter = require('./routes/index'); //Se requieres los archivos de las rutas
const usersRouter = require('./routes/users');
const mainRouter = require('./routes/main');

const app = express();

//Passport

require('./config/passport'); // Se requiere la configuración de passport

//Se crea la conexión a la BD con los datos que tenemos en el archivo .env
mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//Abrimos la conexión a la BD
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function() {
    console.log("Connected successfully");
});

//Establecemos passport como middleware
app.use(passport.initialize()); 

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Establecemos la sesión de express
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(flash()); //usamos el middleware de flash

//Establecemos la configuración inicial 
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Establecemos las rutas
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/main', mainRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


module.exports = app;