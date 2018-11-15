const router = require('koa-better-router')().loadMethods()
const attachmentService = require('../services/attachmentService')
const asyncBusboy = require('async-busboy')

const BASE = '/attachment'

router.post(`${BASE}/upload`, async (ctx, next) => {
    const { files, fields } = await asyncBusboy(ctx.req)

    const staffId = fields.staffId
    const file = files[0]

    const res = await attachmentService.upload(staffId, file)

    ctx.body = res

    await next()
})

router.post(`${BASE}/download`, async (ctx, next) => {
    const staffId = ctx.request.body.staffId
    const attachmentId = ctx.request.body.attachmentId

    const res = await attachmentService.download(staffId, attachmentId)

    ctx.body = res

    await next()
})

router.post(`${BASE}/delete`, async (ctx, next) => {
    const staffId = ctx.request.body.staffId
    const attachmentId = ctx.request.body.attachmentId

    const res = await attachmentService.delete(staffId, attachmentId)

    ctx.body = res

    await next()
})

module.exports = router
