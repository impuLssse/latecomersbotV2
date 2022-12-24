const { magenta, red } = require('colors')
const { Scenes } = require('telegraf')
const session = require('../db/session.js')
const { auth } = require('../http/http.js')

const { Root, Roles, Admins, EditAdmin, AddAdmin, SelectRoleForAdmin } = require('./admins/root.js')
const { Groups, AddGroup, EditGroup, AddStudent, EditStudent, isDeleteGroup, DeleteStudent } = require('./admins/groupsAndStudents.js')
const { Duty, AddLatecomer, AddLatecomerSelectReason, AddLatecomerSelectTime, 
    isAddLatecomer, ListLatecomers, DutyAdmin, EditLatecomer, isDeleteLatecomers } = require('./admins/duties.js')

const { Admin } = require('./admin')
const { Login } = require('./login.js')


const stage = new Scenes.Stage([
    Roles, Admin, Root, Duty, Login, Admins, AddAdmin, EditAdmin, SelectRoleForAdmin, ListLatecomers, DutyAdmin,
    Groups, AddGroup, AddStudent, EditGroup, EditStudent, isDeleteGroup, DeleteStudent, 
    AddLatecomer, AddLatecomerSelectReason, AddLatecomerSelectTime, isAddLatecomer, EditLatecomer, isDeleteLatecomers
])
.start( async ctx => {
    try {
        const { code, role } = ctx.session.state
        
        if (!code) throw new Error()
        if (!(await auth(code))) throw new Error()

        switch (role) {
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
        ctx.scene.enter('Login')
    }
})
.command('/reload', ctx => {
    ctx.session.state = {}
    ctx.scene.enter('Login', ctx.session.state)
})


module.exports = { stage }