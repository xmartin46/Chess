var config = require('../config')
var ejs = require('ejs')
var fs = require('fs')
var expressValidator = require('express-validator')
var crypto = require('crypto')
var passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

function getSignup(req, res) {
    // Ja està a la carpeta "views" automàticament
    res.render('signup', { title: "Registration", errors: false, isLoggedIn: req.isAuthenticated(), username: '' })
}

function postSignup(req, res) {
    req.checkBody('username', 'Username field cannot be empty.').notEmpty();
    req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);
    req.checkBody('username', 'Username can only contain letters, numbers, or underscores.').matches(/^[A-Za-z0-9_-]+$/, 'i');
    req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
    req.checkBody('email', 'Email address must be between 4-100 characters long, please try again.').len(4, 100);
    req.checkBody('password', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody("password", "Password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");
    req.checkBody('password_confirm', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody('password_confirm', 'Passwords do not match, please try again.').equals(req.body.password);

    const errors = req.validationErrors()

    if (errors) {
        res.render('signup', { title: "Registration", errors: errors, isLoggedIn: req.isAuthenticated(), username: '' })
    } else {

        const username = req.body.username
        const email = req.body.email
        const password = req.body.password

        // creating a unique salt for a particular user 
        const salt = crypto.randomBytes(16).toString('hex')

        // hashing user's salt and password with 1000 iterations, 
        // 64 length and sha512 digest
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`)

        config.db.query('INSERT INTO users(username, email, password, salt) VALUES (?, ?, ?, ?)', [username, email, hash, salt], (err, result) => {
            if (err) throw err

            config.db.query('SELECT LAST_INSERT_ID() as user_id', (err, results, fields) => {
                if (err) throw err

                const user_id = results[0].user_id
                const user = {
                    user_id: user_id,
                    user_name: username
                }

                req.login(user, (err) => {
                    if (err) throw err

                    res.redirect('/api/user/profile')
                })
            })
        })
    }
}

// Stores user_id object inside req.session.passsport.user
// In fact, it is the serialised user object
passport.serializeUser(function (user, done) {
    // Testejar el mateix que a deserializeUser (deu ser el mateix)
    done(null, user);
});

// Called by passport.session (app.js Line 46)
passport.deserializeUser(function (user, done) {
    // El segon paràmetre fa dues coses:
    //  1) Si és null/false, req.session.passport = {} => (passport.initialize()????)
    //  2) Si és null/false, req.user = undefined

    //  1) Si és true/alguna paraula => req.session.passport = { user: { serialized user information }}
    //  2) Si és true/alguna paraula => req.users = true (si posem true)/paraula (si posem una paraula)

    // Al ser null/false, com que no exiteix req.session.passaport.user, no estarem autentificats
    // Altrament sí que ho estarem
    done(null, user);
});

function getLogin(req, res) {
    res.render('login', { isLoggedIn: req.isAuthenticated(), username: '' })
}

// Auto-login
// Per desactivar-ho => session: false
/*passportAuthenticate = passport.authenticate('local', {
    successRedirect: '/api/dashboard',
    failureRedirect: '/api/login'
})*/

function passportAuthenticate(req, res, next) {
    // Middleware
    // (err, user_id, info) és el que es passa des de la crida done() a app.js (Linia 63)
    passport.authenticate('local', (err, user, info) => {
        if (err) throw err

        // done(null, false)
        // null != false, però no entra en el if statement
        if (!user) res.redirect('/api/login')
        else { // done(null, somethinf != null/false)
            // Calling login, we implicitly call serializeUser
            req.login(user, (err) => {
                // Now we have req.session.passport
                // & req.session.passport.user
                // & req.user === req.session.passport.user
                res.redirect('/api/user/profile')
            })
        }
    })(req, res, next)
}

function getHome(req, res) {
    if (req.user) res.render('home', { isLoggedIn: req.isAuthenticated(), username: req.user.user_name })
    else res.render('home', { isLoggedIn: req.isAuthenticated(), username: '' })
}

module.exports = {
    getSignup,
    postSignup,
    getLogin,
    getHome,
    passportAuthenticate,
}