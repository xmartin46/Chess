const config = require('../config.js')
const flash = require('req-flash')

function getProfile(req, res) {
    res.render('user', { isLoggedIn: true, username: req.user.user_name })
}

function getSettings(req, res) {
    res.status(200).send("User settings!")
}
function getMatch(req, res) {
    if (req.query.code) {
        // TODO: Agafar l'estat de la room
        const code = req.query.code

        res.render('partida', { isLoggedIn: true, username: req.user.user_name })
    } else {
        config.db.query('SELECT name FROM rooms WHERE user_white = ? OR user_black = ?', [req.user.user_id, req.user.user_id], (err, results, fields) => {
            if (err) throw err

            res.render('match', { isLoggedIn: true, error: req.flash('error'), username: req.user.user_name, matches: results })
        })
    }
}

function postMatch(req, res) {
    if (Object.keys(req.body).length) {
        // Existing room
        const code = req.body.id
        const password = req.body.password

        config.db.query('SELECT password FROM rooms WHERE name=?', [code], (err, results, fields) => {
            if (err) throw err

            if (results.length == 0) {
                req.flash('error', 'The code room does NOT exist')

                return res.redirect('match')
            }
            
            if (password) {
                if (password != results[0].password) {
                    req.flash('error', 'Incorrect password')

                    return res.redirect('match')
                } else {
                    return res.redirect('match?code=' + code)
                }
            }
            
            return res.redirect('match?code=' + code)
        })
    } else {
        // New room
        // Create new entry in ROOM TABLE
        // Math.random() => Random number
        // toString(n) => Number in base n
        // slice(x, y) => Take te string from position x to y (included)
        const code = Math.random().toString(16).slice(2, 8)

        // Mirar si el nom existeix abans d'insertar-ho

        const user = req.session.passport.user.user_id
        const ini_date = Date.now()
        config.db.query('INSERT INTO rooms(name, user_white, ini_date) VALUES (?, ?, ?)', [code, user, ini_date], (err, results, fields) => {
            if (err) throw err

            res.redirect('match?code=' + code)
        })
    }
}

function logout(req, res) {
    // Passport
    req.logout()
    req.session.destroy((err) => {
        if (err) throw err

        res.clearCookie('connect.sid', { path: '/' }).redirect('/api/home')
    })
}

module.exports = {
    getProfile,
    getSettings,
    logout,
    getMatch,
    postMatch
}