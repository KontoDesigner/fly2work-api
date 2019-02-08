const router = require('koa-better-router')().loadMethods()
const geographyService = require('../services/geographyService')
const auth = require('../infrastructure/auth')
const logger = require('../infrastructure/logger')

const BASE = '/geography'

router.get(`${BASE}/sourceMarkets`, auth, async (ctx, next) => {
    const res = await geographyService.getSourceMarkets(ctx)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: res.length })

    await next()
})

router.get(`${BASE}/jobtitles`, auth, async (ctx, next) => {
    const res = await geographyService.getJobTitles(ctx)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res })

    await next()
})

router.get(`${BASE}/destinations`, auth, async (ctx, next) => {
    const res = await geographyService.getDestinations(ctx)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: res.length })

    await next()
})

router.get(`${BASE}/iatacodes`, auth, async (ctx, next) => {
    const res = await geographyService.getIataCodes(ctx)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: res.length })

    await next()
})

module.exports = router
