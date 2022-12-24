const { blue, red, magenta } = require('colors')
const { Scenes } = require('telegraf')
const { Keyboard } = require('telegram-keyboard')
const { auth } = require('../../http/http.js')
const { latecomers, addLatecomer, findLatecomer, delLatecomer, getLatecomersXL, delAllLatecomers } = require( '../../http/latecomers.js' )
const { findStudent, students, addStudent, delStudent } = require('../../http/students.js')
const { Time } = require('../../times.js')
const { back, roleOut, backAdminDutyOrDuty } = require('../helpers.js')
const { admins } = require('../../http/admins.js')
const fs = require('fs')

const Duty = new Scenes.BaseScene('Duty')
const DutyAdmin = new Scenes.BaseScene('DutyAdmin')

let times = [ '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '60', '80' ]
let reasons = [ 'Транспорт', 'Семья', 'Проспал', 'Заявление', 'Другая' ]

const ListLatecomers = new Scenes.BaseScene('ListLatecomers')
const isDeleteLatecomers = new Scenes.BaseScene('isDeleteLatecomers')
const EditLatecomer = new Scenes.BaseScene('EditLatecomer')
const AddLatecomer = new Scenes.BaseScene('AddLatecomer')
const AddLatecomerSelectReason = new Scenes.BaseScene('AddLatecomerSelectReason')
const AddLatecomerSelectTime = new Scenes.BaseScene('AddLatecomerSelectTime')
const isAddLatecomer = new Scenes.BaseScene('isAddLatecomer')


Duty.enter( async ctx => {
    const m = await ctx.replyWithHTML(
        `🔥 Панель дежурного\n— <code>${ctx.session.state.id}</code>\n— <code>${roleOut(ctx)}</code>`,
        Keyboard.reply([ 'Запись' ])
    )
    ctx.session.state.last = m.message_id
})
.hears('Запись', ctx => ctx.scene.enter('AddLatecomer'))
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


// ---------

DutyAdmin.enter( async ctx => {
    const m = await ctx.replyWithHTML(
        `🔥 Панель дежурного\n— <code>${ctx.session.state.id}</code>\n— <code>${roleOut(ctx)}</code>`,
        Keyboard.reply([ 'Опоздавшие', 'Запись', 'Назад' ], {
            columns: 2,
            flat: true,
        })
    )
    ctx.session.state.last = m.message_id
})
.hears('Назад', ctx => back(ctx))
.hears('Опоздавшие', ctx => ctx.scene.enter('ListLatecomers'))
.hears('Запись', ctx => ctx.scene.enter('AddLatecomer'))
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


//  ! ------- ListLatecomers ------ !

ListLatecomers.enter( async ctx => {
    try {
        delete ctx.session.state.inEditLatecomer
        if (!(await auth(ctx.session.state.code))) throw new Error()
        
        let res = await getLatecomersXL(ctx.session.state.code)
        if (res != 1) {
            await fs.unlinkSync('./опоздавшие.xlsx')
            throw new Error()
        }

        const m = await ctx.replyWithDocument({ source: fs.readFileSync('./опоздавшие.xlsx'), filename: 'опоздавшие.xlsx' },
            Keyboard.reply([ 'Очистить всех', 'Назад' ], {
                columns: 3,
                flat: true,
            }),
        )

        ctx.session.state.last = m.message_id
    } catch (e) {
        await ctx.replyWithHTML(`⏱ Пока что опоздавших нет\nПри появлении — тут появится excel документ`,
            Keyboard.reply([ 'Назад' ], {
                columns: 3,
                flat: true,
            }),
        )
    }
})
.hears('Очистить всех', ctx => ctx.scene.enter('isDeleteLatecomers'))
.hears('Назад', ctx => backAdminDutyOrDuty(ctx))
.on('text', async ctx => {
    try {
        let text = ctx.message.text
        let lt = await latecomers.get(ctx.session.state.code)
        let found = lt.find(item => item.student.name == text)
        
        if (found) {
            ctx.session.state.inEditLatecomer = {
                id: found.id,
                name: found.student.name,
                studentId: found.student.id,
                group: found.student.group.name,
                time: found.time,
                reason: found.reason,
            }
            ctx.scene.enter('EditLatecomer')
        }
    } catch (e) {
        console.log(red(`catched ListLatecomers`))
    }
})
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})

isDeleteLatecomers.enter( async ctx => {
    const m = await ctx.replyWithHTML(`❓ Вы реально хотите удалить <b>ВСЕХ ОПОЗДАВШИХ</b>?`,
        Keyboard.reply([ 'Да', 'Назад' ], {
            columns: 3,
            flat: true,
        })
    )
    ctx.session.state.last = m.message_id
})
.hears('Да', async ctx => {
    try {
        let res = await delAllLatecomers(ctx.session.state.code)
        if (res.status == 403) throw new Error('403')

        console.log(red(`[LATECOMERS] '${ctx.chat.username}' — '${ctx.session.state.id}', with code '${ctx.session.state.code}' deleted all LATECOMERS in '${new Time().date(true)}'`))
        
        delete ctx.session.state.inEditGroup
        ctx.scene.enter('DutyAdmin')
    } catch (e) {
        if (e.message == '403') ctx.session.state = {}
        ctx.replyWithHTML(`<b>❌ Что-то пошло не так...</b>`)
    }
})
.hears('Назад', ctx => ctx.scene.enter('ListLatecomers'))
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})

EditLatecomer.enter( async ctx => {
    try {
        const { id, name, group, time, reason } = ctx.session.state.inEditLatecomer
        const msg = await ctx.replyWithHTML(
`👤 Управление опоздавшим студентом <code>${name}</code>\n— из группы <code>${group}</code>\n— по причине <code>${reason}</code>\n— на <code>${time}</code> минут`,
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
        const { id1, role, code } = ctx.session.state
        const { id, name, group, time, reason } = ctx.session.state.inEditLatecomer

        let res = await delLatecomer(ctx.session.state.code, id)

        await ctx.replyWithHTML(`✅ Опоздавший студент <code>${name}</code> успешно удален`)
        console.log(magenta(`[ADMINS] '${ctx.chat.username}' — '${id1}', with role '${role}' and code '${code}', deleted latecomer: '${name}' — from '${group}' — by reason '${reason}' in '${(new Time().date(true))}'`))

        delete ctx.session.state.inEditLatecomer
        ctx.scene.enter('ListLatecomers')
    } catch (e) {
        ctx.session.state = {}
    }
})
.hears('Назад', ctx => {
    delete ctx.session.state.inEditLatecomer
    ctx.scene.enter('ListLatecomers')
})
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        delete ctx.session.state.inEditAdmin
        next()
    } catch (e) {}
})


// ------------------

AddLatecomer.enter( async ctx => {
    delete ctx.session.state.inAddLatecomer

    const m = await ctx.replyWithHTML(`
    📋 Отправьте | Ф ИО | опоздавшего студента\n<b>Например:</b> <code>Петрушкин ИС</code>\n<b>Расшифровка:</b> <code>Петрушкин Иван Сергеевич</code>`,
        Keyboard.reply([ 'Назад' ])
    )
    ctx.session.state.last = m.message_id
})
.hears('Назад', ctx => backAdminDutyOrDuty(ctx))
.on('text', async ctx => {
    try {
        const text = ctx.message.text
        const iso = text.replace(/[^А-Яа-я\s+]/giu, '').trim()
    
        if ((iso.length >= 2 && iso.length <= 18)) {
            let studs = await students.findByName(ctx.session.state.code, iso)

            switch (studs.length) {
                case 0:
                    await ctx.replyWithHTML(`<b>❌ Студент не найден</b>`)
                break;

                case 1:
                    studs.forEach(item => {
                        ctx.session.state.inAddLatecomer = {
                            id: item.id,
                            name: item.name,
                            groupId: item.groupId,
                            groupName: item.group.name,
                        }
                    })
                    ctx.scene.enter('AddLatecomerSelectReason')
                break;

                default:
                    const s = studs.map(item => '<code>' + item.name + ' из группы ' + item.group.name + '</code>').map(item => '\n' + item)
                    const m = await ctx.replyWithHTML(
    `🔍 Найдено несколько\n${ s }`,
                        Keyboard.reply([ (studs.map(item => item.name)), 'Назад' ], {
                            flat: true,
                            columns: 1,
                        })
                    )

                    ctx.session.state.last = m.message_id
                break;
            }
            ctx.session.state.last = m.message_id
            ctx.scene.enter('AddLatecomerSelectReason')
        }
    } catch (e) {
        if (e.message == `403`) ctx.session.state = {}
    }
})


AddLatecomerSelectReason.enter( async ctx => {
    const m = await ctx.replyWithHTML(
        `📋 Укажите <b>причину</b> опоздания
        \n— опоздал <code>${ctx.session.state.inAddLatecomer.name}</code>`,
        Keyboard.reply([ reasons, 'Назад' ], {
            columns: 3,
            flat: true,
        })
    )
    ctx.session.state.last = m.message_id
})
.hears('Назад', ctx => ctx.scene.enter('AddLatecomer'))
.hears(reasons, ctx => {
    ctx.session.state.inAddLatecomer.reason = ctx.message.text
    ctx.scene.enter('AddLatecomerSelectTime')
})
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


AddLatecomerSelectTime.enter( async ctx => {
    const m = await ctx.replyWithHTML(
    `📅 Укажите <b>время</b> опоздания в минутах
    \n— опоздал <code>${ctx.session.state.inAddLatecomer.name}</code>\n— по причине <code>${ctx.session.state.inAddLatecomer.reason}</code>`,
        Keyboard.reply([ times, 'Назад' ], {
            columns: 3,
            flat: true,
        })
    )
    ctx.session.state.last = m.message_id
})
.hears('Назад', ctx => {
    delete ctx.session.state.inAddLatecomer.reason
    ctx.scene.enter('AddLatecomerSelectReason')
})
.hears(times, async ctx => {
    ctx.session.state.inAddLatecomer.time = ctx.message.text
    ctx.scene.enter('isAddLatecomer')
})
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


isAddLatecomer.enter( async ctx => {
    let m = await ctx.replyWithHTML(
    `📝 Проверьте запись
    \n— опоздал <code>${ctx.session.state.inAddLatecomer.name}</code>\n— из группы <code>${ctx.session.state.inAddLatecomer.groupName}</code>\n— по причине <code>${ctx.session.state.inAddLatecomer.reason}</code>\n— на <code>${ctx.session.state.inAddLatecomer.time}</code> минут`,
        Keyboard.reply([ '✅', '🔄', 'Назад' ])
    )
    ctx.session.state.last = m.message_id
})
.hears('Назад', ctx => {
    try {
        delete ctx.session.state.inAddLatecomer.time
        ctx.scene.enter('AddLatecomerSelectTime')
    } catch (e) {}
})
.hears('🔄', async ctx => {
    ctx.scene.enter('AddLatecomer')
})
.hears('✅', async ctx => {
    try {
        let { id, name, time, reason, groupName } = ctx.session.state.inAddLatecomer
        await addLatecomer(ctx.session.state.code, id, time, reason)
        
        console.log(magenta(`[LATECOMERS] '${ctx.session.state.id}' recorded '${name}' from group: '${groupName}', with reason '${reason}' as latecomer on ${time} mins in '${new Time().date(true)}'`))

        delete ctx.session.state.inAddLatecomer
        ctx.scene.enter('AddLatecomer')
    } catch (e) {}
})
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


module.exports = { Duty, AddLatecomer, AddLatecomerSelectReason, AddLatecomerSelectTime, 
    isAddLatecomer, ListLatecomers, DutyAdmin, EditLatecomer, isDeleteLatecomers
}