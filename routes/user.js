const router = require('koa-better-router')().loadMethods()
const userService = require('../services/userService')
const auth = require('../infrastructure/auth')
const logger = require('../infrastructure/logger')

const BASE = '/user'

router.get(`${BASE}/getuser`, auth, async (ctx, next) => {
    const user = await userService.getUser(ctx)

    const res = {
        userName: user.name,
        userRoles: user.roles,
        userEmail: user.email
    }

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res })

    return await next()
})

module.exports = router
