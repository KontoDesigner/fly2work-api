const router = require('koa-better-router')().loadMethods()
const geographyService = require('../services/geographyService')

const BASE = '/geography'

router.get(`${BASE}/sourceMarkets`, async (ctx, next) => {
    const res = await geographyService.getSourceMarkets(ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/roles`, async (ctx, next) => {
    const res = await geographyService.getRoles(ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/destinations`, async (ctx, next) => {
    const res = await geographyService.getDestinations(ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/iatacodes`, async (ctx, next) => {
    const res = await geographyService.getIataCodes(ctx)

    ctx.body = res

    await next()
})

module.exports = router
