const router = require('koa-better-router')().loadMethods()
const excelService = require('../services/excelService')
const mongo = require('../infrastructure/mongo')
const auth = require('../infrastructure/auth')

const BASE = '/excel'

router.post(BASE, auth, async (ctx, next) => {
    const staffs = await mongo
        .collection('staffs')
        .find()
        .toArray()

    const response = await excelService.generateExcel(staffs)

    ctx.body = response

    await next()
})

module.exports = router
