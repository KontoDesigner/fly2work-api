const router = require('koa-better-router')().loadMethods()
const config = require('../infrastructure/config')

router.get('/maintenance', async (ctx, next) => {
    ctx.body = false

    await next()
})

module.exports = router
