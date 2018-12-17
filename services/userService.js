const constants = require('../infrastructure/constants')
const passport = require('koa-passport')

const getUserRoles = async (ctx, user = null) => {
    const u = user ? user : await getUser(ctx)

    let userRoles = []

    //HR
    if (u.name === 'Filip Danielsson') {
        userRoles.push(constants.UserRoles.BTT)
        userRoles.push(constants.UserRoles.BS)

        return userRoles
    }

    //BS
    if (u.name === 'Therese Bellhammar') {
        //|| u.name === 'Filip Danielsson'
        userRoles.push(constants.UserRoles.BS)

        return userRoles
    }

    if (u.upn === 'daniela.luer@tui.com' || u.upn === 'pamela.martin@tui.com') {
        userRoles.push(constants.UserRoles.BS)

        return userRoles
    }

    //BS & BTT
    if (u.name === 'Filip Danielsson' || u.name === 'Paulina Przytocka') {
        userRoles.push(constants.UserRoles.BS)
        userRoles.push(constants.UserRoles.BTT)

        return userRoles
    }

    userRoles.push(constants.UserRoles.BTT)

    // if (u.roles.contains('BTT')) {
    //     userRoles.push(constants.UserRoles.BTT)
    // } else if (u.roles.contains('BS'))ks {
    //     userRoles.push(constants.UserRoles.BS)
    // }

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
