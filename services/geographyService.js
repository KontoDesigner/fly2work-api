const restClient = require('../infrastructure/restClient')
const config = require('../infrastructure/config')

const getSourceMarkets = async () => {
    const sourceMarkets = await restClient.get(`${config.gpxApi}/geography/sourcemarket`)

    return sourceMarkets
}

const getRoles = async () => {
    const roles = await restClient.get(`${config.gpxApi}/position/getjobtitles`)

    return roles
}

const getDestinations = async () => {
    const destinations = await restClient.get(`${config.gpxApi}/report/getalldestsingle`)

    return destinations
}

const getIataCodes = async () => {
    const iataCodes = await restClient.get(`${config.gpxApi}/position/getiatacodes`)

    return iataCodes
}

module.exports = {
    getSourceMarkets,
    getRoles,
    getDestinations,
    getIataCodes
}
