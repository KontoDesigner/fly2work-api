const router = require('koa-better-router')().loadMethods()

router.extend(require('./health'))
router.extend(require('./geography'))
router.extend(require('./staff'))
router.extend(require('./pdf'))
router.extend(require('./attachment'))

router.get('/', async (ctx, next) => {
    const res = router.routes.map(r => ({
        route: r.path,
        method: r.method
    }))

    res.unshift(`▀▀▀ ░░▀░░ ▀░▀`)

    res.unshift(`█░░ ░░█░░ ▄▀▄`)

    res.unshift(`█▀▀ ▀▀█▀▀ █░█`)

    ctx.body = res

    await next()
})

module.exports = router.middleware()
