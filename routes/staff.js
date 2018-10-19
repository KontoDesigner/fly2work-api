const router = require('koa-better-router')().loadMethods()
const mongo = require('../mongo')

router.get('/staff/:id', async (ctx, next) => {
    ctx.body = {
        ok: true
    }

    await next()
})

router.post('/staff', async (ctx, next) => {
    const body = ctx.request.body

    const entity = {
        name: body.name
    }

    console.log(entity)

    ctx.body = {
        ok: true
    }

    await next()
})

module.exports = router
