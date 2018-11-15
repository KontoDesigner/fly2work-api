const router = require('koa-better-router')().loadMethods()
const staffService = require('../services/staffService')

const BASE = '/staff'

router.post(BASE, async (ctx, next) => {
    const body = ctx.request.body

    const res = await staffService.updateStaff(body, ctx)

    ctx.body = res

    return await next()
})

router.post(`${BASE}/new`, async (ctx, next) => {
    const body = ctx.request.body

    const res = await staffService.insertStaff(body, ctx)

    ctx.body = res

    return await next()
})

router.get(BASE, async (ctx, next) => {
    const res = await staffService.getStaffs(ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/count`, async (ctx, next) => {
    const res = await staffService.getStaffCount(ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/getbystatus/:status`, async (ctx, next) => {
    const status = ctx.params.status

    const res = await staffService.getStaffsByStatus(status, ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/getbyid/:id`, async (ctx, next) => {
    const id = ctx.params.id

    const res = await staffService.getStaffById(id, ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/:status/:id`, async (ctx, next) => {
    const id = ctx.params.id
    const status = ctx.params.status

    const res = await staffService.getStaffByIdAndStatus(id, status, ctx)

    ctx.body = res

    await next()
})

module.exports = router
