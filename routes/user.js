const router = require('koa-better-router')().loadMethods()
const userService = require('../services/userService')
const passport = require('koa-passport')

const BASE = '/user'

router.get(`${BASE}/getuserroles`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const res = userService.getUserRoles(ctx)

    ctx.body = res

    return await next()
})

module.exports = router
