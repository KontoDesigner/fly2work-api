const constants = require('../infrastructure/constants')
const passport = require('koa-passport')
const logger = require('tuin-logging')

const getUserRoles = async (ctx, user = null) => {
    const u = user ? user : await getUser(ctx)

    const uR = u.roles ? u.roles : []

    const userRoles = []

    userRoles.push(constants.UserRoles.BS)

    return userRoles
}

const getUserName = async (ctx, user = null) => {
    const u = user ? user : await getUser(ctx)

    return u.name
}

const getUser = async ctx => {
    return new Promise((resolve, reject) => {
        passport.authenticate('oauth-bearer', { session: false }, async function(err, user) {
            if (!user || err) {
                logger.warning(`NOT AUTHENTICATED`, { url: ctx.url })

                ctx.throw(401)
            }

            resolve(user)
        })(ctx)
    })
}

const getUserEmail = async (ctx, user = null) => {
    const u = user ? user : await getUser(ctx)

    return u.upn
}

module.exports = {
    getUser,
    getUserName,
    getUserRoles,
    getUserEmail
}
