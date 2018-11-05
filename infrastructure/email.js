const logger = require('tuin-logging')
const restClient = require('./restClient')
const config = require('./config')
const constants = require('./constants')
const pdf = require('./pdf')
const moment = require('moment')

async function send(staff) {
    logger.info('Building email body..', { staff })

    const email = new constants.Email()
    email.bccTo = []
    email.body = 'Please kindly find the attached file'
    email.ccTo = []
    email.emailTo = [config.emailTo]
    email.isBodyHtml = false
    email.subject = `${staff.status} Request - ${staff.id}`
    email.userAddress = config.userAddress

    logger.info('Building email body successfull, generating pdf..', { staff, email })

    pdf.generatePdfCallback(staff, async response => {
        const mailApi = `${config.mailApi}/${config.name}`

        logger.info('PDF generation successfull, sending email..', { staff, email, mailApi, pdfBytes: response.length })

        email.attachments = [{ data: response, name: `${config.name} - ${staff.id} - ${moment().format('YYYY/MM/DD HH:mm')}.pdf` }]

        const res = await restClient.post(mailApi, email)

        //Prevent large logs
        email.attachments = null

        logger.info('Received result from mail api', { res, staff, email, mailApi, pdfBytes: response.length })
    })
}

module.exports = {
    send
}
