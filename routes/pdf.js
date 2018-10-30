const router = require('koa-better-router')().loadMethods()
const pdf = require('../infrastructure/pdf')
const logger = require('tuin-logging')

const BASE = '/pdf'

router.post(BASE, async (ctx, next) => {
    const staffs = ctx.request.body

    logger.info('Generating pdf..', { staffs })

    const response = await pdf.generatePdfPromise(staffs)

    logger.info('PDF generation successfull', { staffs, pdfBytes: response.length })

    ctx.body = response

    await next()
})

module.exports = router
