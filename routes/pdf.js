const router = require('koa-better-router')().loadMethods()
const pdfService = require('../services/pdfService')
const staffService = require('../services/staffService')
const auth = require('../infrastructure/auth')

const BASE = '/pdf'

router.post(`${BASE}/:id`, auth, async (ctx, next) => {
    const id = ctx.params.id

    const staff = await staffService.getStaffById(id, ctx)

    const res = await pdfService.generatePdfPromise(staff)

    ctx.body = res

    await next()
})

module.exports = router
