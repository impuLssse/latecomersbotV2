const { red, magenta, blue } = require('colors')
const { Scenes, Telegraf } = require('telegraf')
const { Keyboard } = require('telegram-keyboard')
const { back } = require('../helpers.js')

const { auth } = require('../../http/http.js')
const { addGroup, delGroup, groups } = require('../../http/groups')
const { delStudent, findStudent, addStudent, students } = require('../../http/students')
const { Time } = require( '../../times.js' )

const Groups = new Scenes.BaseScene('Groups')

const AddGroup = new Scenes.BaseScene('AddGroup')
const EditGroup = new Scenes.BaseScene('EditGroup')
const isDeleteGroup = new Scenes.BaseScene('isDeleteGroup')

const AddStudent = new Scenes.BaseScene('AddStudent')
const EditStudent = new Scenes.BaseScene('EditStudent')
const DeleteStudent = new Scenes.BaseScene('DeleteStudent')

let msg

// ------------------

Groups.enter( async ctx => {
    try {
        const m = await ctx.replyWithHTML(`⚙ Управление группами`,
            Keyboard.reply([ (await groups.names(ctx.session.state.code)), 'Создать', 'Назад' ], {
                flat: true,
                columns: 3,
            })
        )
        ctx.session.state.last = m.message_id
        delete ctx.session.state.inEditGroup
        delete ctx.session.state.inEsditStudent
    } catch (e) {
        ctx.session.state = {}
    }
})
.hears('Назад', ctx => back(ctx))
.hears('Создать', ctx => ctx.scene.enter('AddGroup'))
.on('text', async ctx => {
    try {
        let text = ctx.message.text
        let res = (await groups.names(ctx.session.state.code))
    
        if ((res.find(item => item == text))) {
            ctx.session.state.inEditGroup = text
            ctx.scene.enter('EditGroup')
        }
    } catch (e) {}
})
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


// ------------------

EditGroup.enter( async ctx => {
    try {
        delete ctx.session.state.inEditStudentId
        delete ctx.session.state.inEditStudentGroupId

        let res = await students.findAllByGroup(ctx.session.state.code, ctx.session.state.inEditGroup)
        if (res.length == 0 || !res) throw new Error()

        msg = await ctx.replyWithHTML(`🗂 Управление группой <code>${ctx.session.state.inEditGroup}</code>`,
                Keyboard.reply([ [res.map( item => item.name)], 'Добавить', 'Удалить', 'Назад' ], {
                    flat: true,
                    columns: 3,
                })
            )
        ctx.session.state.last = msg.message_id

    } catch (e) {
        msg = await ctx.replyWithHTML(`🗂 Управление группой <code>${ctx.session.state.inEditGroup}</code>`,
            Keyboard.reply([ 'Добавить', 'Удалить', 'Назад' ], {
                flat: true,
                columns: 3,
            })
        )
        ctx.session.state.last = msg.message_id
    }
})
.hears('Добавить', ctx => ctx.scene.enter('AddStudent'))
.hears('Удалить', ctx => ctx.scene.enter('isDeleteGroup'))
.hears('Назад', ctx => back(ctx))
.on('text', async ctx => {
    try {
        let text = ctx.message.text
        let res = (await students.findAllByGroup(ctx.session.state.code, ctx.session.state.inEditGroup))

        if (!res) throw new Error()
        let student = (res.filter( item => item.name === text))

        if (student.length > 0) {
            let stud = student.find(item => item)
            let { id, name, groupId } = student.find(item => item)

            ctx.session.state.inEditStudentId = id
            ctx.session.state.inEditStudentGroupId = groupId
            ctx.session.state.inEditStudent = text

            ctx.scene.enter('EditStudent')
        }
    } catch (e) {}
})
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})

// ------------------

EditStudent.enter( async ctx => {
    try {
        msg = await ctx.replyWithHTML(`👤 Управление студентом <code>${ctx.session.state.inEditStudent}</code> группы <code>${ctx.session.state.inEditGroup}</code>`,
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
        let res = (await delStudent(ctx.session.state.code, ctx.session.state.inEditStudentId)).data
        if (res == 'ok') await ctx.replyWithHTML(`✅ Студент <code>${ctx.session.state.inEditStudent}</code> успешно удален`)
        
        delete ctx.session.state.inEditStudentId
        delete ctx.session.state.inEditStudentGroupId
        ctx.scene.enter('EditGroup')
    } catch (e) {
        console.log(e)
    }
})
.hears('Назад', ctx => ctx.scene.enter('EditGroup'))
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        delete ctx.session.state.inEditStudent
        next()
    } catch (e) {}
})


// ------------------

AddGroup.enter( async ctx => {
    const m = await ctx.replyWithHTML(`📋 Отправьте название группы. Например: <code>ИСП9-36-ВБ</code>`,
        Keyboard.reply([ 'Назад' ])
    )
})
.hears('Назад', ctx => ctx.scene.enter('Groups'))
.on('text', async ctx => {
    const text = ctx.message.text
    const iso = text.replace(/[^А-Яа-я0-9\-]/giu, '').trim()

    if (iso != 'Создать' && (iso.length >= 5 && iso.length <= 14)) {
        try {
            const group = await addGroup(ctx.session.state.code, iso)
            if (group.status == 404) throw new Error(`404`)
            if (!group) throw new Error(`403`)

            ctx.replyWithHTML(`Группа <code>${iso}</code> успешно создана`)
        } catch (e) {
            if (e.message == '404') ctx.replyWithHTML(`<b>❌ Такая группа уже существует, либо же произошла непредвиденная ошибка</b>`)
            if (e.message == `403`) ctx.session.state = {}
        }
    }
})
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


// ------------------

AddStudent.enter( async ctx => {
    const m = await ctx.replyWithHTML(`
    📋 Отправьте | Ф ИО | студента\n<b>Например:</b> <code>Петрушкин ИС</code>\n<b>Расшифровка:</b> <code>Петрушкин Иван Сергеевич</code>`,
        Keyboard.reply([ 'Назад' ])
    )
    ctx.session.state.last = m.message_id
})
.hears('Назад', ctx => ctx.scene.enter('EditGroup'))
.on('text', async ctx => {
    const text = ctx.message.text
    const iso = text.replace(/[^А-Яа-я0-9\s+]/giu, '').trim()

    if ((iso.length >= 7 && iso.length <= 18)) {
        try {
            let student = await addStudent(ctx.session.state.code, iso, ctx.session.state.inEditGroup)
            if (!student) throw new Error()

            ctx.replyWithHTML(`✅ Студент <code>${iso}</code> успешно добавлен`)
        } catch (e) {
            ctx.replyWithHTML(
    `<b>❌ Такой студент уже числится в какой-то группе</b>\n\nЕсли это однофамилец с такими же инициалами, то попробуйте добавить любую цифру в конце ФИО\n<b>Например:</b> <code>Петрушкин ИС1</code>`
            )
        }
    }
})
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


// ------------------

isDeleteGroup.enter( async ctx => {
    const m = await ctx.replyWithHTML(`❓ Вы реально хотите удалить группу <code>${ctx.session.state.inEditGroup}</code>?`,
        Keyboard.reply([ 'Да', 'Назад' ], {
            columns: 3,
            flat: true,
        })
    )
    ctx.session.state.last = m.message_id
})
.hears('Да', async ctx => {
    try {
        let group = (await groups.findIdByName(ctx.session.state.code, ctx.session.state.inEditGroup))
        if (!group) throw new Error()

        let res = (await delGroup(ctx.session.state.code, group.id))
        if (!res) throw new Error()

        console.log(magenta(`[ADMINS] '${ctx.chat.username}' — '${ctx.session.state.id}', with code '${ctx.session.state.code}' deleted group '${ctx.session.state.inEditGroup}' in '${new Time().date(true)}'`))
        
        delete ctx.session.state.inEditGroup
        ctx.scene.enter('Groups')
    } catch (e) {
        ctx.replyWithHTML(`<b>❌ Что-то пошло не так...</b>`)
    }
})
.hears('Назад', ctx => ctx.scene.enter('EditGroup'))
.leave( async (ctx, next) => {
    try { 
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.last)
        next()
    } catch (e) {}
})


module.exports = { Groups, AddGroup, EditGroup, isDeleteGroup, DeleteStudent, AddStudent, EditStudent }