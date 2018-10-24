const router = require('koa-better-router')().loadMethods()
const logger = require('tuin-logging')

const BASE = '/geography'

router.get(`${BASE}/flights`, async (ctx, next) => {
    const flights = [
        { value: 'Holiday', label: 'Holiday' },
        { value: 'End of season', label: 'End of season' },
        { value: 'Start of season', label: 'Start of season' },
        { value: 'Other', label: 'Other' }
    ]

    logger.info(`Returning ${BASE}/flights [GET]`, { flights })

    ctx.body = flights

    await next()
})

router.get(`${BASE}/sourceMarkets`, async (ctx, next) => {
    const sourceMarkets = [{ value: 'tuise', label: 'tuise' }, { value: 'tuifi', label: 'tuifi' }]

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, sourceMarkets })

    ctx.body = sourceMarkets

    await next()
})

router.get(`${BASE}/seasons`, async (ctx, next) => {
    const seasons = [{ value: 'Current Season', label: 'Current Season' }, { value: 'Next Season', label: 'Next Season' }]

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, seasons })

    ctx.body = seasons

    await next()
})

router.get(`${BASE}/flightStatuses`, async (ctx, next) => {
    const flightStatuses = [{ value: 'Current Season', label: 'Current Season' }, { value: 'Next Season', label: 'Next Season' }]

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, flightStatuses })

    ctx.body = flightStatuses

    await next()
})

router.get(`${BASE}/roles`, async (ctx, next) => {
    const roles = [{ value: 'Current Season', label: 'Current Season' }, { value: 'Next Season', label: 'Next Season' }]

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, roles })

    ctx.body = roles

    await next()
})

router.get(`${BASE}/destinations`, async (ctx, next) => {
    const destinations = [{ value: 'Current Season', label: 'Current Season' }, { value: 'Next Season', label: 'Next Season' }]

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, destinations })

    ctx.body = destinations

    await next()
})

module.exports = router
