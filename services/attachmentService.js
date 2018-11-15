const logger = require('tuin-logging')
const mongo = require('../infrastructure/mongo')
const moment = require('moment')
const uuid = require('node-uuid')
const fs = require('fs')

const upload = async (staffId, file) => {
    try {
        const size = fs.statSync(file.path).size

        const attachment = {
            id: uuid.v1(),
            data: fs.readFileSync(file.path),
            name: file.filename,
            size: size,
            type: file.mimeType,
            created: moment()._d,
            createdBy: 'TEST',
            group: 'TEST'
        }

        const updateOne = await mongo.collection('staffs').updateOne({ id: staffId }, { $push: { attachments: attachment } })

        logger.info('Upload attachment result', {
            id: uuid.v1(),
            name: file.filename,
            size: size,
            type: file.mimeType,
            created: moment()._d,
            result: updateOne.result
        })

        if (updateOne.result.ok === 1) {
            return {
                ok: true,
                attachment
            }
        }
    } catch (err) {
        logger.error('Error uploading attachment', err, { id: staffId, name: file.name, size: file.size, type: file.type, path: file.path })
    }

    return {
        ok: false
    }
}

const download = async (staffId, attachmentId) => {
    const staff = await mongo.collection('staffs').findOne(
        {
            id: staffId,
            'attachments.id': attachmentId
        },
        { fields: { 'attachments.$': 1, _id: 0 } }
    )

    if (staff) {
        logger.info('Found attachment, downloading..', { staffId, attachmentId })

        return staff.attachments[0].data.buffer
    } else {
        logger.info('Could not find attachment for download', { staffId, attachmentId })
    }
}

const deleteAttachment = async (staffId, attachmentId) => {
    try {
        const result = (await mongo.collection('staffs').updateOne({ id: staffId }, { $pull: { attachments: { id: attachmentId } } })).result

        logger.info('Delete attachment result', { staffId, attachmentId, result })

        if (result.ok === 1) {
            return {
                ok: true
            }
        }
    } catch (err) {
        logger.error('Error deleting attachment', err, { staffId, attachmentId })
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
