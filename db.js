require('dotenv').config()
const MySQLSession = require('telegraf-session-mysql')

const session = new MySQLSession({
    host: process.env.DB_HOST,
    user: process.env.NODE_ENV === 'prod' ? process.env.DB_USER : process.env.DB_LUSER,
    password: process.env.NODE_ENV === 'prod' ? process.env.DB_PASSWORD : process.env.DB_LPASSWORD,
    database: process.env.NODE_ENV === 'prod' ? process.env.DB_NAME : process.env.DB_LNAME,
}, {
    lifetime: 300000, // сессия живет 5 мин в ms
    interval: 2000, // раз в 2 сек мин очищаются истекшие сессии
})

session.connect()

module.exports = { session }