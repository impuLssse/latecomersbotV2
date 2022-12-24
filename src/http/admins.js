const { api } = require('./http')

async function addAdmin (code, name, role) {
    try { 
        return (await api.post('admins/add', {
            name: name,
            role: role
        }, {
            headers: {
                code: code,
            }
        }))
    } catch (e) {
        return undefined
    }
}

async function delAdmin (code, name, role) {
    try { 
        return (await api.post('admins/remove', {
            name: name,
            role: role
        }, {
            headers: {
                code: code,
            }
        }))
    } catch (e) {
        return undefined
    }
}

async function getAdmins (code) {
    let res = await api(`admins/`, {
        headers: {
            code: code,
        }
    })
    
    if (res.statusText == 'OK') return res
}

// ! ------------------

class admins {
    static async get (code) {
        return (await getAdmins(code)).data
    }

    static async del (code, id) {
        return (await delAdmin(code, id)).data
    }

    static async find (code, id) {
        return (await admins.get(code)).find( item => item.id == id)
    }

    static async names (code) {
        return (await admins.get(code)).map( item => item.id)
    }
}


module.exports = { getAdmins, delAdmin, addAdmin, admins }