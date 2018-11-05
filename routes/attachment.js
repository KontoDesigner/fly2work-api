const router = require('koa-better-router')().loadMethods()
const logger = require('tuin-logging')
const body = require('koa-better-body')
const mongo = require('../infrastructure/mongo')
const moment = require('moment')
const uuid = require('node-uuid')
const fs = require('fs')

const BASE = '/attachment'

router.post(`${BASE}/upload`, body(), function*(next) {
    const staffId = this.request.fields.staffId
    const file = this.request.fields.file[0]

    logger.info('Uploading attachment..', { id: staffId, name: file.name, size: file.size, type: file.type, path: file.path })

    let res = false

    try {
        const attachment = {
            id: uuid.v1(),
            data: fs.readFileSync(file.path),
            name: file.name,
            size: file.size,
            type: file.type,
            created: moment()._d
        }

        mongo
            .collection('staffs')
            .updateOne({ id: staffId }, { $push: { attachments: attachment } })
            .then(function(result) {
                if (result.ok === 1) {
                    logger.info('Upload attachment successfull', {
                        id: staffId,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        path: file.path,
                        result
                    })

                    res = true
                }
            })
    } catch (err) {
        logger.error('Error uploading attachment', err, { id: staffId, name: file.name, size: file.size, type: file.type, path: file.path })
    }

    this.body = {
        ok: res
    }

    yield next
})

router.post(`${BASE}/download`, async (ctx, next) => {
    const staffId = ctx.request.body.staffId
    const id = ctx.request.body.id

    logger.info('Downloading attachment..', { staffId, id })

    const attachment = await mongo.collection('staffs').findOne(
        {
            id: staffId,
            'attachments.id': id
        },
        {
            'attachments.$': 1
        }
    )

    if (attachment) {
        logger.info('Found attachment for download', { staffId, id, attachment })
    } else {
        logger.info('Could not find attachment for download', { staffId, id })
    }

    ctx.body = attachment

    await next()
})

router.post(`${BASE}/delete`, async (ctx, next) => {
    const staffId = ctx.request.body.staffId
    const id = ctx.request.body.id

    logger.info('Deleting attachment..', { staffId, id })

    let res = false

    try {
        const result = await mongo.collection('staffs').updateOne({ id: staffId }, { $pull: { id: id } })

        if (result.ok === 1) {
            logger.info('Deleted attachment', { staffId, id, result })

            res = true
        }
    } catch (err) {
        logger.error('Error deleting attachment', err, { id })
    }

    ctx.body = {
        ok: res
    }

    await next()
})

module.exports = router
