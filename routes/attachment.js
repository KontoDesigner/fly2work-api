const router = require('koa-better-router')().loadMethods()
const logger = require('tuin-logging')
const mongo = require('../infrastructure/mongo')
const moment = require('moment')
const uuid = require('node-uuid')
const fs = require('fs')
const asyncBusboy = require('async-busboy')

const BASE = '/attachment'

router.post(`${BASE}/upload`, async (ctx, next) => {
    const { files, fields } = await asyncBusboy(ctx.req)

    const staffId = fields.staffId
    const file = files[0]

    try {
        const size = fs.statSync(file.path).size

        const attachment = {
            id: uuid.v1(),
            data: fs.readFileSync(file.path),
            name: file.filename,
            size: size,
            type: file.mimeType,
            created: moment()._d
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
            ctx.body = {
                ok: true
            }

            return await next()
        }
    } catch (err) {
        logger.error('Error uploading attachment', err, { id: staffId, name: file.name, size: file.size, type: file.type, path: file.path })
    }

    ctx.body = {
        ok: false
    }

    await next()
})

router.post(`${BASE}/download`, async (ctx, next) => {
    const staffId = ctx.request.body.staffId
    const id = ctx.request.body.id

    const staff = await mongo.collection('staffs').findOne(
        {
            id: staffId,
            'attachments.id': id
        },
        { fields: { 'attachments.$': 1, _id: 0 } }
    )

    if (staff) {
        logger.info('Found attachment, downloading..', { staffId, id })

        ctx.body = staff.attachments[0].data.buffer
    } else {
        logger.info('Could not find attachment for download', { staffId, id })
    }

    await next()
})

router.post(`${BASE}/delete`, async (ctx, next) => {
    const staffId = ctx.request.body.staffId
    const id = ctx.request.body.id

    try {
        const result = (await mongo.collection('staffs').updateOne({ id: staffId }, { $pull: { attachments: { id: id } } })).result

        logger.info('Delete attachment result', { staffId, id, result })

        if (result.ok === 1) {
            ctx.body = {
                ok: true
            }

            return await next()
        }
    } catch (err) {
        logger.error('Error deleting attachment', err, { id })
    }

    ctx.body = {
        ok: false
    }

    await next()
})

module.exports = router
