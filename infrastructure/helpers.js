const config = require('./config')
const constants = require('./constants')

function getBTTEmails(sourceMarket) {
    const emailNSourceMarkets = config.emailNSourceMarkets.split(',')
    const emailESourceMarkets = config.emailESourceMarkets.split(',')
    const emailWSourceMarkets = config.emailWSourceMarkets.split(',')
    const emailUKSourceMarkets = config.emailUKSourceMarkets.split(',')

    let res = new constants.EmailRecipients()

    if (emailNSourceMarkets.includes(sourceMarket)) {
        res.to.push(config.emailBTTN), res.cc.push(config.emailBTTNCC)
    } else if (emailESourceMarkets.includes(sourceMarket)) {
        res.to.push(config.emailBTTE), res.cc.push(config.emailBTTECC)
    } else if (emailWSourceMarkets.includes(sourceMarket)) {
        res.to.push(config.emailBTTW), res.cc.push(config.emailBTTWCC)
    } else if (emailUKSourceMarkets.includes(sourceMarket)) {
        res.to.push(config.emailBTTUK), res.cc.push(config.emailBTTUKCC)
    }

    return res
}

function getHREmails(destination) {
    const emailHRTSAGDestinations = config.emailHRTSAGDestinations.split(',')
    const emailHRTDSDestinations = config.emailHRTDSDestinations.split(',')

    let res = new constants.EmailRecipients()

    if (emailHRTSAGDestinations.includes(destination)) {
        res.to.push(config.emailHRTSAG)
    } else if (emailHRTDSDestinations.includes(destination)) {
        res.to.push(config.emailHRTDS)
    }

    return res
}

function getConfirmedHREmail(destination, greenLightUpdatedBy) {
    const emailHRTSAGDestinations = config.emailHRTSAGDestinations.split(',')
    const emailHRTDSDestinations = config.emailHRTDSDestinations.split(',')

    if (emailHRTDSDestinations.includes(destination)) {
        if (greenLightUpdatedBy === 'Samantha Brito' || greenLightUpdatedBy === 'Cynthia Scheuer') {
            return 'criticalcases.hr.tsag@tui.com'
        }
    } else if (emailHRTSAGDestinations.includes(destination)) {
        return 'notifications.hr.tsag@tui.com'
    }

    return null
}

function parseCost(val) {
    var parsed = parseFloat(val)

    if (isNaN(parsed)) {
        return 0
    }

    return parsed
}

function getTotalCost(flights) {
    let totalCost = 0

    if (flights && flights.length > 0) {
        for (const flight of flights) {
            totalCost =
                totalCost +
                (parseCost(flight.flightCost ? flight.flightCost.replace(',', '.') : 0) +
                    parseCost(flight.xbagCost ? flight.xbagCost.replace(',', '.') : 0) +
                    parseCost(flight.hotelCost ? flight.hotelCost.replace(',', '.') : 0))
        }
    }

    return totalCost.toFixed(2)
}

module.exports = {
    parseCost,
    getBTTEmails,
    getTotalCost,
    getHREmails,
    getConfirmedHREmail
}
