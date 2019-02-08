const passport = require('koa-passport')
const userService = require('../services/userService')
const logger = require('./logger')
const config = require('./config')

async function auth(ctx, next, roles = []) {
    if (ctx.method === 'OPTIONS' || ctx.path.startsWith('/health')) {
        return await next()
    }

    return passport.authenticate('oauth-bearer', { session: false }, async function(err, user) {
        if (!user || err) {
            logger.warning(`NOT AUTHENTICATED`, { url: ctx.url, user, err })

            ctx.throw(401)
        }

        if (roles.length > 0) {
            const userRoles = await userService.getUserRoles(ctx, user)

            //BTT routes
            if (!userRoles.some(ur => roles.includes(ur))) {
                logger.warning(`NOT AUTHORIZED (MISSING ROLE)`, { url: ctx.url, user, requiredRoles: roles, userRoles })

                ctx.throw(403)
            }
        }

        if (config.maintenance === true) {
            ctx.throw(503)
        }

        await next()
    })(ctx, next)
}

module.exports = auth
