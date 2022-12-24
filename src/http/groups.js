const { api } = require('./http')

async function getGroups (code) {
    let res = await api(`groups/`, {
        headers: {
            code: code,
        }
    })

    if (res.statusText == 'OK') return res
}

async function addGroup (code, name) {
    let res = await api.post(`groups/add`, {
            name: name,
        }, {
            headers: {
                code: code,
            }
        }
    )

    if (res.statusText == 'OK') return res
}

async function delGroup (code, id) {
    let res = await api.post(`groups/remove`, {
            id: id,
        }, {
            headers: {
                code: code,
            }
        }
    )

    if (res.statusText == 'OK') return res
}


class  groups {
    static async get (code) {
        return (await getGroups(code)).data
    }

    static async names (code) {
        return (await groups.get(code)).map( item => item.name)
    }

    static async findNameById (code, id) {
        return (await groups.get(code)).find( item => item.id == id)
    }

    static async findIdByName (code, name) {
        return (await groups.get(code)).find( item => item.name == name)
    }
}

module.exports = { getGroups, addGroup, delGroup, groups }