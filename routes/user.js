const router = require('koa-better-router')().loadMethods()
const userService = require('../services/userService')
const auth = require('../infrastructure/auth')
const logger = require('../infrastructure/logger')

const BASE = '/user'

router.get(`${BASE}/getuser`, auth, async (ctx, next) => {
    const user = await userService.getUser(ctx)
    const userName = await userService.getUserName(ctx, user)
    const userRoles = await userService.getUserRoles(ctx, user)
    const userEmail = await userService.getUserEmail(ctx, user)

    const res = {
        userName,
        userRoles,
        userEmail
    }

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res })

    return await next()
})

module.exports = router
