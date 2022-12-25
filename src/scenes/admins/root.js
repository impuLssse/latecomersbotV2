const { blue, magenta, green, red } = require('colors')
const { Scenes, Markup } = require('telegraf')
const { Keyboard } = require('telegram-keyboard')
const { back, roleOut } = require('../helpers.js')
const { auth } = require('../../http/http.js')
const { admins, addAdmin, delAdmin } = require('../../http/admins.js')
const { Time } = require('../../times.js')

const Root = new Scenes.BaseScene('Root')
const Roles = new Scenes.BaseScene('Roles')
const Admins = new Scenes.BaseScene('Admins')

const AddAdmin = new Scenes.BaseScene('AddAdmin')
const EditAdmin = new Scenes.BaseScene('EditAdmin')
const SelectRoleForAdmin = new Scenes.BaseScene('SelectRoleForAdmin')


Root.enter( async ctx => {
    try {
        if (!(await auth(ctx.session.state.code))) throw new Error()

        const m = await ctx.replyWithHTML(`🚀 Полный доступ\nДобро пожаловать <code>${ctx.session.state.id}</code>!`, 
            Keyboard.reply([ 'Админы', 'Группы', 'Дежурные' ], {
                columns: 3,
            }),
        )
        ctx.session.state.last = m.message_id
    } catch (e) {
        ctx.session.state = {}
    }
})
.hears('Админы', async ctx => ctx.scene.enter('Roles'))
.hears('Группы', async ctx => ctx.scene.enter('Groups'))
.hears('Дежурные', async ctx => ctx.scene.enter('DutyAdmin'))
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


Roles.enter( async ctx => {
    try {
        if (!(await auth(ctx.session.state.code))) throw new Error()

        const m = await ctx.replyWithHTML(`🚀 Выберите действие`, 
            Keyboard.reply([ 'Список', 'Добавить', 'Назад' ], {
                columns: 3,
            }),
        )
        ctx.session.state.last = m.message_id
    } catch (e) {
        ctx.session.state = {}
    }
})
.hears('Назад', ctx => back(ctx))
.hears('Список', ctx => ctx.scene.enter('Admins'))
.hears('Добавить', ctx => ctx.scene.enter('AddAdmin'))
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


Admins.enter( async ctx => {
    try {
        delete ctx.session.state.inAddAdmin
        delete ctx.session.state.inEditAdmin

        if (!(await auth(ctx.session.state.code))) throw new Error()
        
        let adms = await admins.names(ctx.session.state.code)

        const m = await ctx.replyWithHTML(`📜 Список администраторов`, 
            Keyboard.reply([ adms, 'Назад' ], {
                columns: 3,
                flat: true,
            }),
        )
        ctx.session.state.last = m.message_id
    } catch (e) {
        console.log(red(`err`))
        ctx.session.state = {}
    }
})
.hears('Назад', ctx => ctx.scene.enter('Roles'))
.on('text', async ctx => {
    try {
        let text = ctx.message.text
        let adms = await admins.names(ctx.session.state.code)
        if (!adms) throw new Error()

        if ( (adms.find(item => item)) ) {
            let res = await admins.find(ctx.session.state.code, ctx.message.text)

            ctx.session.state.inEditAdmin = {
                id: res.id,
                code: res.code,
                role: res.role,
                createdAt: res.createdAt,
            }
            ctx.scene.enter('EditAdmin')
        }

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


// ------------------


EditAdmin.enter( async ctx => {
    try {
        const { id, code, role, createdAt } = ctx.session.state.inEditAdmin
        const msg = await ctx.replyWithHTML(`👤 Управление администратором <code>${id}</code>\n— <code>${role}</code>\n— <code>${code}</code>\n— создан <code>${createdAt}</code>`,
            Keyboard.reply([ 'Удалить', 'Назад' ], {
                flat: true,
                columns: 3,
            })
        )
        ctx.session.state.last = msg.message_id
    } catch (e) {
        ctx.replyWithHTML(`<b>❌ Что-то пошло не так...</b>`)
    }
})
.hears('Удалить', async ctx => {
    try {
        const { id, code, role } = ctx.session.state

        let res = await delAdmin(ctx.session.state.code, ctx.session.state.inEditAdmin.id)
        if (!res) throw new Error()

        await ctx.replyWithHTML(`✅ Админ <code>${ctx.session.state.inEditAdmin.id}</code> успешно удален`)
        console.log(magenta(`[ADMINS] '${ctx.chat.username}' — '${id}', with role '${role}' and code '${code}', deleted: '${ctx.session.state.inEditAdmin.id}' — '${ctx.session.state.inEditAdmin.role}' — '${ctx.session.state.inEditAdmin.code}' in '${(new Time().date(true))}'`))

        delete ctx.session.state.inEditAdmin
        ctx.scene.enter('Admins')
    } catch (e) {
        ctx.session.state = {}
    }
})
.hears('Назад', ctx => ctx.scene.enter('Admins'))
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        delete ctx.session.state.inEditAdmin
        next()
    } catch (e) {}
})


// ------------------

AddAdmin.enter( async ctx => {
    const m = await ctx.replyWithHTML(`📋 Задайте <b>любое</b> имя администратору. \nБез лишних иероглифов\nНапример: <code>Петрушкин ИС</code>, или <code>Царь</code>`,
        Keyboard.reply([ 'Назад' ])
    )
})
.hears('Назад', ctx => ctx.scene.enter('Roles'))
.on('text', async ctx => {
    const text = ctx.message.text
    const iso = text.replace(/[^А-Яа-я0-9\-]/giu, '').trim()

    try {
        ctx.session.state.inAddAdmin = {
            name: iso,
        }
        ctx.scene.enter('SelectRoleForAdmin')
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


SelectRoleForAdmin.enter( async ctx => {
    const m = await ctx.replyWithHTML(`📋 Укажите роль`,
        Keyboard.reply([ 'Админ', 'Дежурный', 'Назад' ], {
            columns: 2,
        })
    )
})
.hears('Назад', ctx => ctx.scene.enter('AddAdmin'))
.hears('Админ', async ctx => {
    try {
        const { id, role, code } = ctx.session.state.inAddAdmin
        const admin = await addAdmin(ctx.session.state.code, ctx.session.state.inAddAdmin.name, 'admin')
        
        ctx.scene.enter('Admins')
        ctx.replyWithHTML(`✅ Админ <code>${ctx.session.state.inAddAdmin.name}</code> успешно добавлен`)
        console.log(magenta(`[ADMINS] '${ctx.chat.username}' — '${ctx.session.state.id}', with role ${ctx.session.state.role} and code ${ctx.session.state.code}, create: 'ADMIN' | ${ctx.session.state.inAddAdmin.id} in '${new Time().date(true)}'`))

        delete ctx.session.state.inAddAdmin
    } catch (e) {}
})
.hears('Дежурный', async ctx => {
    try {
        const admin = await addAdmin(ctx.session.state.code, ctx.session.state.inAddAdmin.name, 'duty')

        ctx.scene.enter('Admins')
        ctx.replyWithHTML(`✅ Дежурный <code>${ctx.session.state.inAddAdmin.name}</code> успешно добавлен`)

        delete ctx.session.state.inAddAdmin
    } catch (e) {}
})
.hears('Дежурный', ctx => {
    ctx.scene.enter('AddAdmin')
})
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


module.exports = { Root, Roles, Admins, AddAdmin, EditAdmin, SelectRoleForAdmin }