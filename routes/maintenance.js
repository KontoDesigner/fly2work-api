const router = require('koa-better-router')().loadMethods()
const config = require('../infrastructure/config')

router.get('/maintenance', async (ctx, next) => {
    ctx.body = config.main

    await next()
})

router.get('/maint', async (ctx, next) => {
    ctx.body = config.main

    await next()
})

router.get('/maintenance/maintenance', async (ctx, next) => {
    ctx.body = false

    await next()
})

module.exports = router
