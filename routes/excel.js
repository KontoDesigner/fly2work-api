const router = require('koa-better-router')().loadMethods()
const excelService = require('../services/excelService')
const auth = require('../infrastructure/auth')
const staffService = require('../services/staffService')

const BASE = '/excel'

router.post(BASE, auth, async (ctx, next) => {
    const staffs = await staffService.getStaffs()

    const response = await excelService.generateExcel(staffs)

    ctx.body = response

    await next()
})

module.exports = router
