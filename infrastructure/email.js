const logger = require('tuin-logging')
const restClient = require('./restClient')
const config = require('./config')
const constants = require('./constants')
const pdfService = require('../services/pdfService')
// const excel = require('./excel')
const moment = require('moment')

async function send(staff) {
    logger.info('Sending email..', { staff })

    const email = new constants.Email()
    email.bccTo = []
    email.body = 'Please kindly find the attached file(s)'
    email.ccTo = []
    email.emailTo = [config.emailTo]
    email.isBodyHtml = false
    email.subject = `${staff.status} Request - ${staff.id}`
    email.emailUserAddress = config.emailUserAddress

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

    //Send email
    const res = await restClient.post(mailApi, email)

    logger.info('Mail api result', { res, staff, email, mailApi })
}

module.exports = {
    send
}
