const { Telegraf } = require('telegraf')
const { red, blue } = require('colors')
const { session } = require('../db.js')
const { stage } = require('./scenes/index.js')

const bot = new Telegraf('5610129913:AAE9oSJL53-1SQKFDo4o12dLzxrQjNvi7AY')

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


module.exports = { bot }