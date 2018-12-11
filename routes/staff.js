const router = require('koa-better-router')().loadMethods()
const staffService = require('../services/staffService')
const passport = require('koa-passport')
const constants = require('../infrastructure/constants')
const uuid = require('node-uuid')

const BASE = '/staff'

router.post(`${BASE}/confirmgreenlight`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const body = ctx.request.body

    const res = await staffService.confirmGreenLight(body, ctx)

    ctx.body = res

    return await next()
})

router.post(`${BASE}/decline`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const body = ctx.request.body

    const res = await staffService.declineStaff(body, ctx)

    ctx.body = res

    return await next()
})

router.post(BASE, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const body = ctx.request.body

    const res = await staffService.updateOrInsertStaff(body, ctx)

    ctx.body = res

    return await next()
})

router.post(`${BASE}/new`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const body = ctx.request.body

    const res = await staffService.insertStaffFromGpx(body, ctx)

    ctx.body = res

    return await next()
})

router.get(BASE, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const res = await staffService.getStaffs(ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/count`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const res = await staffService.getStaffCount(ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/getbystatus/:status`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const status = ctx.params.status

    const res = await staffService.getStaffsByStatus(status, ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/getbygreenlight/:greenlight`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const greenLight = ctx.params.greenlight

    const res = await staffService.getStaffsByGreenLight(greenLight, ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/getbyidandgreenlight/:id/:greenlight`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const id = ctx.params.id
    const greenLight = ctx.params.greenlight

    const res = await staffService.getStaffByIdAndGreenLight(id, greenLight, ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/getbyid/:id`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const id = ctx.params.id

    const res = await staffService.getStaffById(id, ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/:status/:id`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const id = ctx.params.id
    const status = ctx.params.status

    const res = await staffService.getStaffByIdAndStatus(id, status, ctx)

    ctx.body = res

    await next()
})

router.get(`${BASE}/model`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const res = new constants.Staff()

    res.id = uuid.v1()

    ctx.body = res

    await next()
})

module.exports = router
