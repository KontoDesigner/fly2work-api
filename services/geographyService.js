const logger = require('tuin-logging')
const restClient = require('../infrastructure/restClient')
const config = require('../infrastructure/config')

const getSourceMarkets = async ctx => {
    const sourceMarkets = await restClient.get(`${config.gpx}/geography/sourcemarket`)

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: sourceMarkets.length })

    return sourceMarkets
}

const getRoles = async ctx => {
    const roles = await restClient.get(`${config.gpx}/position/getjobtitles`)

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: roles.length })

    return roles
}

const getDestinations = async ctx => {
    const destinations = await restClient.get(`${config.gpx}/report/getalldestsingle`)

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: destinations.length })

    return destinations
}

const getIataCodes = async ctx => {
    const iataCodes = await restClient.get(`${config.gpx}/position/getiatacodes`)

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: iataCodes.length })

    return iataCodes
}

module.exports = {
    getSourceMarkets,
    getRoles,
    getDestinations,
    getIataCodes
}
