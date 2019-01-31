const app = require('./app')
const config = require('./config')

//config.db.connect(function (err) {
   // if (err) throw err

    //console.log('Connection to Database stablished...')

    app.listen((process.env.PORT || 8080), (process.env.HOST || '0.0.0.0'), () => {
        console.log(`API REST running on https://${(process.env.HOST || '0.0.0.0.')}:${config.port}`)
    })
//})