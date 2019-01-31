const express = require('express')
const auth = require('../controllers/auth.js')
const authMiddleware = require('../middlewares/auth.js')
const user = require('./user.js')
const api = express.Router()

// User
api.use('/user', user)

// Routes
api.get('/home', /*authMiddleware.checkLoggedOut,*/ auth.getHome)
api.get('/signup', authMiddleware.checkLoggedOut, auth.getSignup)
api.post('/signup', authMiddleware.checkLoggedOut, auth.postSignup)
api.get('/login', authMiddleware.checkLoggedOut, auth.getLogin)
api.post('/login', authMiddleware.checkLoggedOut, auth.passportAuthenticate)

module.exports = api