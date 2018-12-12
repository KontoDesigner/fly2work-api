const logger = require('tuin-logging')
const restClient = require('../infrastructure/restClient')
const config = require('../infrastructure/config')

async function confirm(positionAssignId, confirmedDate) {
    logger.info('Sending GPX confirm request', { positionAssignId, confirmedDate })

    const req = {
        PositionAssignId: positionAssignId,
        ConfirmedDate: confirmedDate
    }

    let res = {}

    try {
        res = await restClient.post(`${config.gpxApi}/ctx/confirm`, req)

        logger.info('GPX confirm result', { req })

        if (res.ok === true) {
            return true
        }
    } catch (err) {
        logger.error('Error GPX confirm', err, { req })
    }

    return false
}

module.exports = {
    confirm
}
