const logger = require('tuin-logging')
const restClient = require('./restClient')
const config = require('./config')
const constants = require('./constants')
const pdf = require('./pdf')
const excel = require('./excel')
const moment = require('moment')
const mongo = require('./mongo')

async function send(staff) {
    logger.info('Sending email..', { staff })

    const email = new constants.Email()
    email.bccTo = []
    email.body = 'Please kindly find the attached file'
    email.ccTo = []
    email.emailTo = [config.emailTo]
    email.isBodyHtml = false
    email.subject = `${staff.status} Request - ${staff.id}`
    email.userAddress = config.userAddress

    const mailApi = `${config.mailApi}/${config.name}`
    const excelData = excel.generateExcel(staff, 'base64')
    const pdfData = await pdf.generatePdfPromise(staff)

    email.attachments = [
        //Pdf
        { data: pdfData, name: `${staff.name} - ${moment().format('YYYY-MM-DD HH:mm')}.pdf` },
        //Excel
        { data: excelData, name: `${staff.name} - ${moment().format('YYYY-MM-DD HH:mm')}.pdf` }
    ]

    //Attachments
    const staffAttachments = await mongo.collection('staffs').findOne(
        {
            id: staff.id
        },
        { fields: { 'attachments.$': 1, _id: 0 } }
    )

    if (staffAttachments && staffAttachments.attachments) {
        for (var attachment of staffAttachments.attachments) {
            const attachmentData = Buffer.from(attachment.data.buffer).toString('base64')

            email.attachments.push({ data: attachmentData, name: attachment.name })
        }
    }

    //Send email
    const res = await restClient.post(mailApi, email)

    //Prevent large logs
    email.attachments = null

    logger.info('Mail api result', { res, staff, email, mailApi, attachments: email.attachments.length })
}

module.exports = {
    send
}
