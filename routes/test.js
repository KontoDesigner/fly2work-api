const router = require('koa-better-router')().loadMethods()
const config = require('../infrastructure/config')

router.get('/test', async (ctx, next) => {
    ctx.body = config.maintenance

    await next()
})

router.get('/test/test', async (ctx, next) => {
    ctx.body = false

    await next()
})

module.exports = router
