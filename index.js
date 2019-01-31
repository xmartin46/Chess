const app = require('./app')
const config = require('./config')

//config.db.connect(function (err) {
   // if (err) throw err

    //console.log('Connection to Database stablished...')

    app.listen(config.port, config.host, () => {
        console.log(`API REST running on https://${config.host}:${config.port}`)
    })
//})