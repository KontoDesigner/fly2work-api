const constants = require('../infrastructure/constants')
const passport = require('koa-passport')

const getUserRoles = async (ctx, user = null) => {
    const u = user ? user : await getUser(ctx)

    const uR = u.roles ? u.roles : []

    const userRoles = []

    if (uR.includes('DS_F2W_HR_Team')) {
        userRoles.push(constants.UserRoles.HR)
    }

    if (uR.includes('DS_F2W_Edit')) {
        userRoles.push(constants.UserRoles.BS)
    }

    if (uR.includes('DS_F2W_Business_Travel_Team')) {
        userRoles.push(constants.UserRoles.BTT)
    }

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
