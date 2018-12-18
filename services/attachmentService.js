const logger = require('tuin-logging')
const mongo = require('../infrastructure/mongo')
const moment = require('moment')
const uuid = require('node-uuid')
const fs = require('fs')
const userService = require('./userService')

const upload = async (staffId, file, ctx) => {
    const user = await userService.getUser(ctx)
    const userName = await userService.getUserName(ctx, user)
    const userRoles = await userService.getUserRoles(ctx, user)

    try {
        const size = fs.statSync(file.path).size

        const attachment = {
            id: uuid.v1(),
            data: fs.readFileSync(file.path),
            name: file.filename,
            size: size,
            type: file.mimeType,
            created: moment()._d,
            createdBy: userName,
            group: userRoles.join(', ')
        }

        const updateOne = await mongo.collection('staffs').updateOne({ id: staffId }, { $push: { attachments: attachment } })

        logger.info('Upload attachment result', {
            id: uuid.v1(),
            name: file.filename,
            size: size,
            type: file.mimeType,
            created: moment()._d,
            result: updateOne.result,
            url: ctx.url
        })

        if (updateOne.result.ok === 1) {
            return {
                ok: true,
                attachment
            }
        }
    } catch (err) {
        logger.error('Error uploading attachment', err, {
            id: staffId,
            name: file.name,
            size: file.size,
            type: file.type,
            path: file.path,
            url: ctx.url
        })
    }

    return {
        ok: false
    }
}

const download = async (staffId, attachmentId, ctx) => {
    const staff = await mongo.collection('staffs').findOne(
        {
            id: staffId,
            'attachments.id': attachmentId
        },
        { collection: { 'attachments.$': 1, _id: 0 } }
    )

    if (staff) {
        logger.info('Downloading attachment', { staffId, attachmentId, url: ctx.url })

        return staff.attachments[0].data.buffer
    } else {
        logger.info('Could not find attachment for download', { staffId, attachmentId, url: ctx.url })
    }
}

const deleteAttachment = async (staffId, attachmentId, ctx) => {
    try {
        const result = (await mongo.collection('staffs').updateOne({ id: staffId }, { $pull: { attachments: { id: attachmentId } } })).result

        logger.info('Delete attachment result', { staffId, attachmentId, result, url: ctx.url })

        if (result.ok === 1) {
            return {
                ok: true
            }
        }
    } catch (err) {
        logger.error('Error deleting attachment', err, { staffId, attachmentId, url: ctx.url })
    }

    return {
        ok: false
    }
}

module.exports = {
    upload,
    download,
    delete: deleteAttachment
}
