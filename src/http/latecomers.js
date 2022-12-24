const { api } = require('./http')
const fs = require('fs')
const { Blob } = require('buffer')

async function getLatecomers (code) {
    let res = await api(`latecomers/`, {
        headers: {
            code: code,
        }
    })

    if (res.statusText == 'OK') return res
}

async function getLatecomersXL (code) {
    try {
        const res = (await api(`latecomers/xl`, {
            headers: {
                code: code,
            },
            responseType: 'arraybuffer',
        }))

        fs.writeFileSync('./опоздавшие.xlsx', res.data)
        return 1
    } catch (e) {}
}

async function addLatecomer (code, id, time, reason) {
    let res = await api.post(`latecomers/add`, {
        studentId: id,
        time: time,
        reason: reason,
    }, {
        headers: {
            code: code,
        }
    })

    if (res.statusText == 'OK') return res
}

async function findLatecomer (code, studentId) {
    let res = await api(`latecomers/` + studentId, {
        headers: {
            code: code,
        }
    })

    if (res.statusText == 'OK') return res
}


async function delLatecomer (code, id) {
    let res = await api.post(`latecomers/remove`, {
        id: id,
    }, {
        headers: {
            code: code,
        }
    })

    if (res.statusText == 'OK') return res
}

async function delAllLatecomers (code) {
    return (await api(`latecomers/removeAll`, {
        headers: {
            code: code,
        }
    }))
}


// ! -------------

class latecomers {
    static async get (code) {
        return (await getLatecomers(code)).data.filter(item => item.student)
    }
    
    static async names (code) {
        return (await latecomers.get(code)).map(item => item.student.name)
    }
}

class duties {
    static async get (code) {
        return (await getLatecomers(code)).data
    }
}

module.exports = { getLatecomers, delLatecomer, addLatecomer, findLatecomer, getLatecomersXL, delAllLatecomers, latecomers }