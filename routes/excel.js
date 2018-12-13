const router = require('koa-better-router')().loadMethods()
const excelService = require('../services/excelService')
const mongo = require('../infrastructure/mongo')
const passport = require('koa-passport')

const BASE = '/excel'

router.post(BASE, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const staffs = await mongo
        .collection('staffs')
        .find()
        .toArray()

    const response = await excelService.generateExcel(staffs)

    ctx.body = response

    await next()
})

module.exports = router
