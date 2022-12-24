const { api } = require('./http')
const { groups } = require('./groups.js')

async function addStudent (code, name, groupName) {
    try {
        let groupId = (await groups.findIdByName(code, groupName)).id
        let res = await api.post(`students/add`, {
            name: name,
            groupId: groupId,
        }, {
            headers: {
                code: code,
            }
        })
        
        if (res.statusText == 'OK') return res
        if (res.status == 400) return undefined
    } catch (e) {
        console.log(e)
    }
        
}

async function delStudent (code, id) {
    let res = await api.post(`students/remove`, {
        id: id
    }, {
        headers: {
            code: code,
        }
    })
    
    if (res.statusText == 'OK') return res
}

async function findStudent (code, name) {
    const url = `students/` + name
    let res = await api(url, {
        headers: {
            code: code,
        }
    })
    
    if (res.statusText == 'OK') return res
}

async function getStudents (code) {
    let res = await api(`students/`, {
        headers: {
            code: code,
        }
    })

    if (res.statusText == 'OK') return res
}

// ! ------------

class students {
    static async get (code) {
        return (await getStudents(code)).data
    }

    static async names (code) {
        return (await students.get(code)).map( item => item.name)
    }

    static async findAllByGroup (code, groupName) {
        try {
            let id = (await groups.findIdByName(code, groupName)).id
            let studs = (await students.get(code)).filter( item => item.groupId == id)

            if (studs.length == 0) throw new Error(`404`)
            else return studs
        } catch (e) {
            if (e.message == `404`) return `404`
        }
    }

    static async findByName (code, name) {
        return (await findStudent(code, name)).data
    }

    static async findById (code, id) {
        return (await students.get(code)).find( item => item.id == id)
    }
}

module.exports = { addStudent, delStudent, findStudent, students }