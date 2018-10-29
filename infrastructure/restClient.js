const axios = require('axios')

async function get(url) {
    try {
        console.log(`[GET] ${url}`, 'RestClient')

        const response = await axios.get(url)

        return response.data
    } catch (err) {
        console.log(err, 'RestClient')

        throw new Error(err)
    }
}

async function post(url, data) {
    try {
        console.log(`[POST] ${url} ${JSON.stringify(data)}`, 'RestClient')

        const response = await axios.post(url, data)

        return response.data
    } catch (err) {
        console.log(err, 'RestClient')

        throw new Error(err)
    }
}

module.exports = {
    get,
    post
}
