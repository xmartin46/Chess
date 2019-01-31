const express = require('express')
const authMiddleware = require('../middlewares/auth.js')
const user = require('../controllers/user')
const flash = require('req-flash')
const api = express.Router()

// Flash
api.use(flash())

// Routes
api.get('/profile', authMiddleware.checkLoggedIn, user.getProfile)
api.get('/settings', authMiddleware.checkLoggedIn, user.getSettings)
//api.get('/new_match', authMiddleware.checkLoggedIn, user.newMatch)
api.get('/logout', authMiddleware.checkLoggedIn, user.logout)

// Proves
api.get('/match', authMiddleware.checkLoggedIn, user.getMatch)
api.post('/match', authMiddleware.checkLoggedIn, user.postMatch)

module.exports = api