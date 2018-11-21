const constants = require('../infrastructure/constants')
const logger = require('tuin-logging')

const getUserRoles = async ctx => {
    const user = ctx.state.user

    let userRoles = []

    userRoles.push(constants.UserRoles.BTT)

    // if (user.roles.contains('BTT')) {
    //     userRoles.push(constants.UserRoles.BTT)
    // } else if (user.roles.contains('BS')) {
    //     userRoles.push(constants.UserRoles.BS)
    // }

    logger.info(`OUTGOING ${ctx.method}`, { user, url: ctx.url, userRoles })

    return userRoles
}

module.exports = {
    getUserRoles
}
