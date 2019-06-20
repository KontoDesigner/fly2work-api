const router = require('koa-better-router')().loadMethods()

router.extend(require('./health'))
router.extend(require('./maint'))
router.extend(require('./geography'))
router.extend(require('./staff'))
router.extend(require('./pdf'))
router.extend(require('./attachment'))
router.extend(require('./excel'))
router.extend(require('./user'))
router.extend(require('./comment'))

router.get('/', async (ctx, next) => {
    res.unshift(`▀▀▀ ░░▀░░ ▀░▀`)

    res.unshift(`█░░ ░░█░░ ▄▀▄`)

    res.unshift(`█▀▀ ▀▀█▀▀ █░█`)

    ctx.body = res

    await next()
})

module.exports = router.middleware()
