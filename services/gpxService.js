const logger = require('tuin-logging')
const restClient = require('../infrastructure/restClient')
const config = require('../infrastructure/config')

async function confirm(positionAssignId, date) {
    logger.info('Sending GPX confirm request', { positionAssignId, date })

    const req = {
        positionAssignId: positionAssignId,
        date: date
    }

    let res = {}

    try {
        res = await restClient.post(`${config.gpxApi}/positionassign/confirm`, req)

        logger.info('GPX confirm result', { positionAssignId, date })

        if (res.ok === true) {
            return true
        }
    } catch (err) {
        logger.error('Error GPX confirm', err, { positionAssignId, date })
    }

    return false
}

module.exports = {
    confirm
}
