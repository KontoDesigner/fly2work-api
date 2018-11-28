const constants = require('../infrastructure/constants')

const getUserRoles = (ctx, user = null) => {
    const u = user ? user : getUser(ctx)

    let userRoles = []

    if (u.name === 'Therese Bellhammar') {
        //|| u.name === 'Filip Danielsson'
        userRoles.push(constants.UserRoles.BS)

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

const getUserName = (ctx, user = null) => {
    const u = user ? user : getUser(ctx)

    return u.name
}

const getUser = ctx => {
    return ctx.state.user
}

const getUserEmail = (ctx, user = null) => {
    const u = user ? user : getUser(ctx)

    return u.upn
}

module.exports = {
    getUser,
    getUserName,
    getUserRoles,
    getUserEmail
}
