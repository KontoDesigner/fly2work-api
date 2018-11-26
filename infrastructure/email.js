const logger = require('tuin-logging')
const restClient = require('./restClient')
const config = require('./config')
const constants = require('./constants')
const pdfService = require('../services/pdfService')
// const excel = require('./excel')
const moment = require('moment')

async function send(staff, statusText) {
    logger.info('Started send email', { staff })

    if (!staff.emails || staff.emails.length === 0) {
        logger.info('No emails specified in request, aborting send', { staff })

        return
    }

    const email = new constants.Email()
    email.bccTo = []
    email.body = `${statusText}<br><br>Please kindly find the attached file(s)<br><br>Click <a href="${config.web}/${staff.status}/${
        staff.id
    }">Click</a> to go to request`
    email.ccTo = []
    email.emailTo = staff.emails
    email.isBodyHtml = true
    email.subject = `${staff.status} Request - ${staff.id}`
    email.userAddress = config.emailUserAddress

    const mailApi = `${config.mailApi}/${config.name}`
    // const excelData = excel.generateExcel(staff, 'binary')
    // const excelDataString = 'data:application/pdf;base64,' + excelData.toString('base64')
    const pdfData = await pdfService.generatePdfPromise(staff)
    const pdfDataString = 'data:application/pdf;base64,' + pdfData.toString('base64')

    email.attachments = [
        //pdf
        { data: pdfDataString, name: `${staff.firstName} ${staff.lastName} - ${moment().format('YYYY-MM-DD HH:mm')}.pdf` }
        // //excel
        // { data: excelDataString, name: `${staff.name} - ${moment().format('YYYY-MM-DD HH:mm')}.xlsx` }
    ]

    for (var attachment of staff.attachments) {
        const attachmentData = 'data:application/pdf;base64,' + attachment.data.buffer.toString('base64')

        email.attachments.push({ data: attachmentData, name: attachment.name })
    }

    logger.info('Sending email', { staff, email })

    //Send email
    const res = await restClient.post(mailApi, email)

    logger.info('Mail api result', { res, staff, email, mailApi })
}

module.exports = {
    send
}
