const router = require('koa-better-router')().loadMethods()
const userService = require('../services/userService')
const auth = require('../infrastructure/auth')

const BASE = '/user'

router.get(`${BASE}/getuserroles`, auth, async (ctx, next) => {
    const res = await userService.getUserRoles(ctx)

    ctx.body = res

    return await next()
})

module.exports = router
