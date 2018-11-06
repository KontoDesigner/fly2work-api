const router = require('koa-better-router')().loadMethods()
const pdf = require('../infrastructure/pdf')
const logger = require('tuin-logging')

const BASE = '/pdf'

router.post(BASE, async (ctx, next) => {
    const staff = ctx.request.body

    const response = await pdf.generatePdfPromise(staff)

    logger.info('PDF generation result', { staff, pdfBytes: response.length })

    ctx.body = response

    await next()
})

module.exports = router
