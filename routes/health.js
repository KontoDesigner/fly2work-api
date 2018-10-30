const router = require('koa-better-router')().loadMethods()
const pdf = require('./pdf')

router.get('/health', async (ctx, next) => {
    ctx.body = {
        ok: true
    }

    await next()
})

module.exports = router
