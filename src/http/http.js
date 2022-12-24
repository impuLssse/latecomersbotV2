const { default: axios } = require('axios')
const { red } = require('colors')

const api = axios.create({
    baseURL: 'http://localhost:5000/',
})


async function auth (code) {
    let res = await api('auth/isAuth', {
        headers: {
            code: code,
        }
    })
    
    if (res.statusText == 'OK') return res
}

module.exports = { api, auth }
