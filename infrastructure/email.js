const logger = require('tuin-logging')
const restClient = require('./restClient')
const config = require('./config')
const constants = require('./constants')

async function send(staff) {
    const email = new constants.Email()

    email.attachments = null
    email.bccTo = []
    email.body = 'test'
    email.ccTo = []
    email.emailTo = [config.emailTo]
    email.isBodyHtml = false
    email.subject = `${staff.status} request - ${staff.id}`
    email.userAddress = config.userAddress

    logger.info('Sending email', { email, staff })

    const res = await restClient.post(`${config.mailApi}/${config.name}`, email)

    logger.info('Email result', { res, email, staff })

    return res
}

module.exports = {
    send
}
