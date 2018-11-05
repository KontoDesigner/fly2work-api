const router = require('koa-better-router')().loadMethods()
const logger = require('tuin-logging')
const body = require('koa-better-body')
const mongo = require('../infrastructure/mongo')
const Binary = require('mongodb').Binary
const fs = require('fs')

const BASE = '/attachment'

router.post(`${BASE}/upload`, body(), function*(next) {
    const staffId = this.request.fields.staffId
    const file = this.request.fields.file[0]
    const params = { id: staffId, name: file.name, size: file.size, type: file.type, path: file.path }

    logger.info('Uploading attachment..', params)

    let res = false
    try {
        var data = fs.readFileSync(file.path)

        mongo
            .collection('staffs')
            .updateOne({ id: staffId }, { $push: { attachments: Binary(data) } })
            .then(function(result) {
                if (result.ok === 1) {
                    logger.info('Upload attachment successfull', params, result)

                    res = true
                }
            })
    } catch (err) {
        logger.error('Error uploading attachment', err, params)
    }

    this.body = {
        ok: res
    }

    yield next
})

router.post(`${BASE}/download`, async (ctx, next) => {
    ctx.body = {
        ok: true
    }

    await next()
})

module.exports = router
