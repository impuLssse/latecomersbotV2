

let day   = new Date().getDate().toString()
let month = new Date().getMonth().valueOf() + 1
let year  = new Date().getFullYear().toString().replace('20', '')
let hour  = new Date().getHours()
let min   = new Date().getMinutes()

class Time {
    date (withTime) {
        const date = day + '.' + month + '.' + year
        const dateWithTime = day + '.' + month + '.' + year + ' | ' + hour + ':' + min
        return withTime ? dateWithTime : date
    }
}

module.exports = { Time }
