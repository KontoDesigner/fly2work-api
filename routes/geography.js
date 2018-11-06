const router = require('koa-better-router')().loadMethods()
const logger = require('tuin-logging')
const restClient = require('../infrastructure/restClient')
const config = require('../infrastructure/config')

const BASE = '/geography'

router.get(`${BASE}/sourceMarkets`, async (ctx, next) => {
    const sourceMarkets = await restClient.get(`${config.gpx}/geography/sourcemarket`)

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: sourceMarkets.length })

    ctx.body = sourceMarkets

    await next()
})

router.get(`${BASE}/roles`, async (ctx, next) => {
    const roles = await restClient.get(`${config.gpx}/position/getjobtitles`)

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: roles.length })

    ctx.body = roles

    await next()
})

router.get(`${BASE}/destinations`, async (ctx, next) => {
    const destinations = await restClient.get(`${config.gpx}/report/getalldestsingle`)

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: destinations.length })

    ctx.body = destinations

    await next()
})

module.exports = router
