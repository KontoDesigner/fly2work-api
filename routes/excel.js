const router = require('koa-better-router')().loadMethods()
const excelService = require('../services/excelService')
const logger = require('tuin-logging')
const mongo = require('../infrastructure/mongo')

const BASE = '/excel'

router.post(BASE, async (ctx, next) => {
    const staffs = await mongo
        .collection('staffs')
        .find()
        .toArray()

    const response = await excelService.generateExcel(staffs)

    logger.info('Excel generation result', { staffs, excelBytes: response.length })

    ctx.body = response

    await next()
})

module.exports = router
