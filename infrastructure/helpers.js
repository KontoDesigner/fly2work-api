const config = require('./config')

function getBTTEmails(sourceMarket) {
    const emailNSourceMarkets = config.emailNSourceMarkets.split(',')
    const emailESourceMarkets = config.emailESourceMarkets.split(',')
    const emailWSourceMarkets = config.emailWSourceMarkets.split(',')

    let res = {
        to: [],
        cc: []
    }

    if (emailNSourceMarkets.includes(sourceMarket)) {
        res.to.push(config.emailBTTN), res.cc.push(config.emailBTTNCC)
    } else if (emailESourceMarkets.includes(sourceMarket)) {
        res.to.push(config.emailBTTE), res.cc.push(config.emailBTTECC)
    } else if (emailWSourceMarkets.includes(sourceMarket)) {
        res.to.push(config.emailBTTW), res.cc.push(config.emailBTTWCC)
    }

    return res
}

function parseCost(val) {
    var parsed = parseInt(val)

    if (isNaN(parsed)) {
        return 0
    }

    return parsed
}

function getTotalCost(flights) {
    let totalCost = 0

    for (const flight of flights) {
        totalCost = totalCost + (parseCost(flight.flightCost) + parseCost(flight.xbagCost) + parseCost(flight.hotelCost))
    }

    return totalCost
}

module.exports = {
    parseCost,
    getBTTEmails,
    getTotalCost
}
