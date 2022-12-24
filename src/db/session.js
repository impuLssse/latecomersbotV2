const MySQLSession = require('telegraf-session-mysql')

// prod
// const session = new MySQLSession({
//     host: 'localhost',
//     user: 'back',
//     password: 'fero3423dv',
//     database: 'lt',
// }, {
//     lifetime: 300000, // сессия живет 5 мин в ms
//     interval: 2000, // раз в 2 сек мин очищаются истекшие сессии
// })

// local dev
const session = new MySQLSession({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'latecomers',
}, {
    lifetime: 300000, // сессия живет 5 мин в ms
    interval: 2000, // раз в 2 сек мин очищаются истекшие сессии
})

session.connect()

module.exports = session