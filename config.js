const mysql = require('mysql')
const hp_config = require('./helpers/config')

var db = mysql.createConnection({
  host: hp_config.DB_HOST,
  user: hp_config.DB_USER,
  password: hp_config.DB_PASSWORD,
  database: hp_config.DB_NAME
});

module.exports = {
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    db
}