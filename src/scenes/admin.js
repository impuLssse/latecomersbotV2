const { blue, magenta, green, red } = require('colors')
const { Scenes, Markup } = require('telegraf')
const { auth } = require('../http/http.js')
const { Keyboard } = require('telegram-keyboard')
const { roleOut } = require('./helpers.js')


const Admin = new Scenes.BaseScene('Admin').enter( async ctx => {
    try {
        if (!(await auth(ctx.session.state.code))) throw new Error()
        const m = await ctx.replyWithHTML(
        `🔥 Добро пожаловать в админку\n— <code>${ctx.session.state.id}</code>\n— <code>${roleOut(ctx)}</code>`,
            Keyboard.reply([ 'Группы', 'Дежурные' ], {
                columns: 3,
            }),
        )
        ctx.session.state.last = m.message_id
    } catch (e) {
        ctx.session.state = {}
    }
})
.hears('Группы', async ctx => {
    try {
        if (!(await auth(ctx.session.state.code))) throw new Error()
        ctx.scene.enter('Groups')
    } catch (e) { 
        ctx.session.state = {}
    }
})
.hears('Дежурные', async ctx => {
    try {
        if (!(await auth(ctx.session.state.code))) throw new Error()
        ctx.scene.enter('DutyAdmin')
    } catch (e) {
        ctx.session.state = {}
    }
})
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})

module.exports = { Admin }