const { Scenes, Markup } = require('telegraf')
const { Keyboard } = require('telegram-keyboard')
const { errCode } = require('../errors.js')
const { red, green, magenta } = require('colors')
const { Time } = require('../times.js')
const { auth } = require( '../http/http.js' )
const { session } = require( '../../db.js' )


const Login = new Scenes.BaseScene('Login')

.enter( async (ctx) => {
    try {
        const m = await ctx.reply('🔒 Отправь мне код', Keyboard.remove())
        ctx.session.state = { last: m.message_id }
    } catch (e) {}
})
.on('text', async ctx => {
    const { text } = ctx.message
    const code = text.trim()

    if (code && (code.length > 6 && code.length < 20)) {
        try {
            let res = await auth(code)
            if (!res) throw new Error()

            console.log(green(`[LOGIN] '${ctx.chat.username}' — '${res.data.id}', sign with role '${res.data.role}' and code '${res.data.code}' in '${(new Time().date(true))}'`))
            
            ctx.session.state = {
                id: res.data.id,
                code: res.data.code,
                role: res.data.role,
                createdAt: res.data.createdAt,
            }

            switch (res.data.role) {
                case 'ROOT':
                    ctx.scene.enter('Root')
                break;
    
                case 'ADMIN':
                    ctx.scene.enter('Admin')
                break;
    
                case 'DUTY':
                    ctx.scene.enter('Duty')
                break;
            }
        } catch (e) {
            const m = await ctx.replyWithHTML(errCode)
            if (ctx.session.state.last) { ctx.session.state.last = m.message_id }
        }
    } else {
        const m = await ctx.replyWithHTML(errCode)
        if (ctx.session.state.last) { ctx.session.state.last = m.message_id }
    }
})
.leave( async (ctx, next) => {
    try {
        if (ctx.session.state.last) { await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last) }
        next()
    } catch (e) {}
})
    
module.exports = { Login }