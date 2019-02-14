const logger = require('../infrastructure/logger')
const restClient = require('../infrastructure/restClient')
const config = require('../infrastructure/config')
const moment = require('moment')

async function confirm(ctx, positionAssignId, confirmedDate, destination, staffId, direction, user) {
    logger.info('Sending GPX confirm request', { positionAssignId, confirmedDate, destination, staffId, direction, user })

    const req = {
        PositionAssignId: positionAssignId,
        ConfirmedDate: confirmedDate !== null ? moment(confirmedDate, 'DD/MM/YYYY', true).format('YYYY-MM-DD') : null,
        Destination: destination,
        StaffId: staffId,
        Direction: direction
    }

    let res = {}

    try {
        res = await restClient.post(`${config.gpxApi}/ctx/confirm`, req, ctx)

        logger.info('GPX confirm result', { req, res, user })

        if (res.ok === true) {
            return true
        } else {
            logger.warning('Could not send confirm to GPX', { req, res, user })
        }
    } catch (err) {
        logger.error('Error GPX confirm', err, { req, user })
    }

    return false
}

module.exports = {
    confirm
}
