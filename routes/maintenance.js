const router = require('koa-better-router')().loadMethods()
const config = require('../infrastructure/config')

router.get('/maintenance', async (ctx, next) => {
    ctx.body = config.maintenance

    await next()
})

module.exports = router
