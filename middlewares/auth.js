function checkLoggedIn (req, res, next) {
    // After calling deserializeUser
    if (req.isAuthenticated()) {
        return next()
    } else {
        return res.redirect('/api/login')
    }
}

function checkLoggedOut (req, res, next) {
    if (!req.isAuthenticated()) {
        return next()
    } else {
        return res.redirect('/api/user/profile')
    }
}

module.exports = {
    checkLoggedIn,
    checkLoggedOut
}