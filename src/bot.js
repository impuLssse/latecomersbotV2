const { Telegraf } = require('telegraf')
const { blue } = require('colors')
const { session } = require('../db.js')
const { stage } = require('./scenes/index.js')

const bot = new Telegraf(process.env.TOKEN)

bot.use(session.middleware());
bot.use(stage.middleware());

bot.telegram.setMyCommands([
    { command: '/start', description: 'пуск' },
    { command: '/reload', description: 'перезапуск (снова вводить код)' },
])

bot.command('/reload', async ctx => {
    ctx.scene.reenter()
})

bot.launch()
    .then( console.log(blue(`[BOT] started`)) )
    .catch( e => console.log(e))


module.exports = { bot }