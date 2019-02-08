const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const expressValidator = require('express-validator')
const config = require('./config')
const crypto = require('crypto')
const chess = require('chess.js')
const hp_config = require('./helpers/config')
const app = express()
const api = require('./routes/index.js')

// Static files
app.use('/api/user', express.static('public'));
app.use('*/css', express.static('public/css'));
app.use('*/js', express.static('public/js'));
app.use('*/img', express.static('public/img'));

// Socket
const server = require('http').Server(app)
const io = require('socket.io')(server)

io.on('connection', (socket) => {
    console.log('User connected...')

    // HANDSHAKING de benvinguda
    socket.emit('handshaking')

    socket.on('handshaking', (msg) => {
        socket.client_info = msg

        // Take room fen (state) from DB
        config.db.query('SELECT fen FROM rooms WHERE name = $1', [msg.room], (err, results, fields) => {
            if (err) throw err

            if (results.rows.length == 0) throw err // ERRRRRROR

            const game_state = results.rows[0].fen

            socket.client_info.game_state = game_state

            socket.emit('handshaking fen', game_state)
        })
    })

    socket.on('what am I', (msg) => {
        config.db.query('SELECT user_white, user_black FROM rooms WHERE name = $1', [msg.room], (err, results, fields) => {
            if (err) throw err

            if (results.rows.length == 0) throw err //????????????????????

            if (msg.user_id == results.rows[0].user_white) {
                socket.emit('you are white')
            } else if (!results.rows[0].user_black) {
                config.db.query('UPDATE rooms SET user_black = $1 WHERE name = $2', [msg.user_id, msg.room], (err, results, fields) => {
                    if (err) throw err
                })

                socket.emit('you are black')
            } else if (msg.user_id == results.rows[0].user_black) {
                socket.emit('you are black')
            } else {
                socket.emit('you are spectator')
            }
        })
    })

    socket.on('my id?', (user) => {
        config.db.query('SELECT id FROM users WHERE username = $1', [user], (err, results, fields) => {
            if (err) throw err
            
            if (results.rows.length == 0) throw err //////// ??????????????
            
            socket.emit('your id', results.rows[0].id)
        })
    })

    /*socket.on('disconnect', () => {
        console.log('User disconnected...')
        io.emit('disconnect', socket.client_info.room)
    })*/

    socket.on('chat message', function (msg) {
        io.emit('chat message', msg)
    })

    /*socket.on('disconnect game state', (msg) => {
        // TODOOOOOOOOOOOOOOOO
    })*/

    socket.on('move', (game_state) => {
        socket.client_info.game_state = game_state

        config.db.query('UPDATE rooms SET fen = $1 WHERE name = $2', [game_state, socket.client_info.room], (err, results, fields) => {
            if (err) throw err
        })

        const message = {
            game_state: game_state,
            room: socket.client_info.room
        }

        io.emit('move', message)
    })
})

// Authentication
const session = require('express-session')
const passport = require('passport')
//const MySQLStore = require('express-mysql-session')(session);
const pgSession = require('connect-pg-simple')(session)
const LocalStrategy = require('passport-local').Strategy

// View
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(expressValidator())

// Authentication
app.use(cookieParser())

/*var options = {
    host: hp_config.DB_HOST,
    user: hp_config.DB_USER,
    password: hp_config.DB_PASSWORD,
    database: hp_config.DB_NAME,
    port: hp_config.DB_PORT,
    ssl: true
    
}*/

//var sessionStore = new pgSession()

app.use(session({
    secret: hp_config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    //store: sessionStore,
    // HTTPS => cookie: { secure: true }
}))

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    function (username, password, done) {
        config.db.query('SELECT id, password, salt FROM users WHERE username = $1', [username], (err, results, field) => {
            if (err) return done(err)

            if (results.rows.length === 0) return done(null, false)
            if (results.rows.length > 1) return done(null, false)
            
            const userSalt = results.rows[0].salt
            const userPassword = results.rows[0].password

            var hashedPassword = crypto.pbkdf2Sync(password, userSalt, 1000, 64, `sha512`).toString(`hex`);
            if (hashedPassword !== userPassword) return done(null, false)

            return done(null, { user_id: results.rows[0].id, user_name: username })
        })
    }
));

app.use('/api', api)

module.exports = server