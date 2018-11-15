const router = require('koa-better-router')().loadMethods()
const pdfService = require('../services/pdfService')

const BASE = '/pdf'

router.post(BASE, async (ctx, next) => {
    const staff = ctx.request.body

    const res = await pdfService.generatePdfPromise(staff)

    ctx.body = res

    await next()
})

module.exports = router
