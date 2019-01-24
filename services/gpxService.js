const logger = require('tuin-logging')
const restClient = require('../infrastructure/restClient')
const config = require('../infrastructure/config')

async function confirm(ctx, positionAssignId, confirmedDate, destination, staffId) {
    logger.info('Sending GPX confirm request', { positionAssignId, confirmedDate })

    const req = {
        PositionAssignId: positionAssignId,
        ConfirmedDate: confirmedDate,
        Destination: destination,
        StaffId: staffId
    }

    let res = {}

    try {
        res = await restClient.post(`${config.gpxApi}/ctx/confirm`, req, ctx)

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
