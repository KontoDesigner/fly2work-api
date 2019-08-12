const router = require('koa-better-router')().loadMethods()
const config = require('../infrastructure/config')
const basicAuth = require('koa-basic-auth')

router.extend(require('./health'))
router.extend(require('./maint'))
router.extend(require('./geography'))
router.extend(require('./staff'))
router.extend(require('./pdf'))
router.extend(require('./attachment'))
router.extend(require('./excel'))
router.extend(require('./user'))
router.extend(require('./comment'))

router.get('/', basicAuth({ name: config.basicAuthAdminUser, pass: config.basicAuthAdminPassword }), async (ctx, next) => {
    const routes = router.routes
        .filter(r => r.route !== '/')
        .map(r => ({
            route: r.path,
            method: r.method
        }))

    const res = {
        config,
        routes
    }

    ctx.body = res

    await next()
})

module.exports = router.middleware()
