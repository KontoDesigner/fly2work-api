const router = require('koa-better-router')().loadMethods()
const geographyService = require('../services/geographyService')
const passport = require('koa-passport')

const BASE = '/geography'

router.get(`${BASE}/sourceMarkets`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const res = await geographyService.getSourceMarkets(ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/roles`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const res = await geographyService.getRoles(ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/destinations`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const res = await geographyService.getDestinations(ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/iatacodes`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const res = await geographyService.getIataCodes(ctx)

    ctx.body = res

    await next()
})

module.exports = router
