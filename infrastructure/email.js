const logger = require('./logger')
const restClient = require('./restClient')
const config = require('./config')
const constants = require('./constants')
const pdfService = require('../services/pdfService')
// const excel = require('./excel')
const moment = require('moment')
const mongo = require('./mongo')

async function send(staff, statusText, emails) {
    logger.info('Started send email', { staff, emails })

    if (!emails || !emails.to || !emails.cc || emails.to.length === 0) {
        logger.info('No emails specified in request, aborting send', { staff, emails })

        return false
    }

    const comments = staff.comments
        ? staff.comments.sort(function(a, b) {
              return new Date(b.created) - new Date(a.created)
          })
        : []

    let trs = []

    for (var comment of comments) {
        trs.push(
            `<tr>
                <td>${comment.text}</td>
                <td>${comment.createdBy}</td>
                <td>${comment.group}</td>
                <td>${moment(comment.created).format('DD/MM/YYYY HH:mm')}</td>
            </tr>`
        )
    }

    const table = `<table width="600" style="border:1px solid #333">
            <tr>
                <th align="left">Comment</th>
                <th align="left">Created By</th>
                <th align="left">Group</th>
                <th align="left">Created</th>
            </tr>
            
            ${trs}
        </table>`

    const status = staff.status !== constants.Statuses.New && staff.greenLight === false ? 'pendinghr' : staff.status

    const email = new constants.Email()
    email.bccTo = []

    email.body = `
    ${config.scope !== 'PROD' ? `ATTENTION! ENVIRONMENT: ${config.scope}!<br><br>` : ''}
    ${statusText}
    ${comments.length > 0 ? `<br><br>${table}<br>` : '<br><br>'}
    Please kindly find the attached file(s)
    <br><br>Click <a href="${config.web}/${status}/${staff.id}">here</a> to go to request`

    email.ccTo = emails.cc
    email.emailTo = emails.to
    email.isBodyHtml = true
    email.subject = `${staff.status !== constants.Statuses.New && staff.greenLight === false ? 'PendingHR' : staff.status} Request - ${
        staff.iataCode
    } ${staff.firstName} ${staff.lastName} ${staff.preferredFlightDate}`
    email.userAddress = config.emailUserAddress

    const mailApi = `${config.mailApi}/${config.name}`
    // const excelData = excel.generateExcel(staff, 'binary')
    // const excelDataString = 'data:application/pdf;base64,' + excelData.toString('base64')
    const pdfData = await pdfService.generatePdfPromise(staff)
    const pdfDataString = 'data:application/pdf;base64,' + pdfData.toString('base64')

    email.attachments = [
        //pdf
        { data: pdfDataString, name: `${staff.firstName} ${staff.lastName} - ${moment().format('DD/MM/YYYY HH:mm')}.pdf` }
        // //excel
        // { data: excelDataString, name: `${staff.name} - ${moment().format('DD/MM/YYYY HH:mm')}.xlsx` }
    ]

    for (var attachment of staff.attachments) {
        const attachmentData = 'data:application/pdf;base64,' + attachment.data.buffer.toString('base64')

        email.attachments.push({ data: attachmentData, name: attachment.name })
    }

    logger.info('Sending email', { staff, emails })

    //Send email
    let res = {}

    try {
        res = await restClient.post(mailApi, email)

        logger.info('Mail api result', { res, staff, mailApi, statusText, emails })

        if (res.ok === true) {
            await insertSentEmails(staff, email, statusText, null)

            return true
        } else {
            logger.warning('Could not send email', { res, staff, mailApi, statusText, emails })

            await insertSentEmails(staff, email, statusText, `Response error: ${res.errors}`)
        }
    } catch (err) {
        logger.error('Error sending email', err, { staff, email, mailApi, statusText, emails })

        await insertSentEmails(staff, email, statusText, `Connection error: ${err.message}`)
    }

    return false
}

async function insertSentEmails(staff, email, statusText, error) {
    if (!staff.id || staff.id === '') {
        return
    }

    const sentEmail = {
        to: email.emailTo,
        ccTo: email.ccTo,
        attachments: email.attachments.length,
        statusText,
        date: new Date(),
        error
    }

    try {
        let updateOne = {}

        if (!staff.sentEmails || staff.sentEmails.length === 0) {
            updateOne = await mongo.collection('staffs').updateOne({ id: staff.id }, { $set: { sentEmails: [sentEmail] } })
        } else {
            updateOne = await mongo.collection('staffs').updateOne({ id: staff.id }, { $push: { sentEmails: sentEmail } })
        }

        logger.info('Insert sent emails result', {
            id: staff.id,
            sentEmail,
            result: updateOne.result
        })
    } catch (err) {
        logger.error('Error inserting sent email', err, { staff, email, statusText, err })
    }
}

module.exports = {
    send
}
