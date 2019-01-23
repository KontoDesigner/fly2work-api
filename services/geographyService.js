const restClient = require('../infrastructure/restClient')
const config = require('../infrastructure/config')

const getSourceMarkets = async ctx => {
    const sourceMarkets = await restClient.get(`${config.gpxApi}/geography/sourcemarket`, ctx)

    return sourceMarkets
}

const getJobTitles = async ctx => {
    const roles = await restClient.get(`${config.gpxApi}/position/getjobtitles`, ctx)

    return roles
}

const getDestinations = async ctx => {
    const destinations = await restClient.get(`${config.gpxApi}/report/getalldestsingle`, ctx)

    return destinations
}

const getIataCodes = async ctx => {
    const iataCodes = await restClient.get(`${config.gpxApi}/position/getiatacodes`, ctx)

    return iataCodes
}

module.exports = {
    getSourceMarkets,
    getJobTitles,
    getDestinations,
    getIataCodes
}
