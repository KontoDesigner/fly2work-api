const axios = require('axios')
const logger = require('tuin-logging')

async function get(url, ctx) {
    let config = {}

    try {
        if (ctx) {
            const jwt = ctx.request.headers['authorization']

            config = {
                headers: {
                    Authorization: jwt
                }
            }
        }

        logger.info('RestClient GET', { url })

        const response = await axios.get(url, config)

        return response.data
    } catch (err) {
        logger.error('RestClient error GET', err, { url })

        throw new Error(err)
    }
}

async function post(url, data, ctx) {
    let config = {}

    try {
        if (ctx) {
            const jwt = ctx.request.headers['authorization']

            config = {
                headers: {
                    Authorization: jwt
                }
            }
        }

        logger.info('RestClient POST', { url })

        const response = await axios.post(url, data, config)

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
