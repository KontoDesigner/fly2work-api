const axios = require('axios')
const logger = require('tuin-logging')

async function get(url) {
    try {
        logger.info('RestClient GET', { url })

        const response = await axios.get(url)

        return response.data
    } catch (err) {
        logger.error('RestClient error GET', err, { url })

        throw new Error(err)
    }
}

async function post(url, data) {
    try {
        logger.info('RestClient POST', { url })

        const response = await axios.post(url, data)

        return response.data
    } catch (err) {
        logger.error('RestClient error POST', err, { url, data })

        throw new Error(err)
    }
}

module.exports = {
    get,
    post
}
