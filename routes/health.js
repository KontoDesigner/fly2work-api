const router = require('koa-better-router')().loadMethods()

router.get('/health', async (ctx, next) => {
    ctx.body = {
        ok: true
    }
    await next()
})

module.exports = router
