const router = require('koa-better-router')().loadMethods()
const excel = require('../infrastructure/excel')
const logger = require('tuin-logging')

const BASE = '/excel'

router.post(BASE, async (ctx, next) => {
    const staff = ctx.request.body

    const response = await excel.generateExcel(staff)

    logger.info('Excel generation result', { staff, excelBytes: response.length })

    ctx.body = response

    await next()
})

module.exports = router
