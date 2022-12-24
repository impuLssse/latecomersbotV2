

let back = (ctx) => {
    switch (ctx.session.state.role) {
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
}

let backAdminDutyOrDuty = (ctx) => {
    switch (ctx.session.state.role) {
        case 'ROOT':
            ctx.scene.enter('DutyAdmin')
            break;

        case 'ADMIN':
            ctx.scene.enter('DutyAdmin')
            break;

        case 'DUTY':
            ctx.scene.enter('Duty')
            break;
    }
}


let roleOut = (ctx) => {
    switch (ctx.session.state.role) {
        case 'ROOT':
            return `полный доступ`
            break;

        case 'ADMIN':
            return `админ`
            break;

        case 'DUTY':
            return `дежурный`
            break;
    }
}

module.exports = { back, roleOut, backAdminDutyOrDuty }