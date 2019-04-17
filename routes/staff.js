const router = require('koa-better-router')().loadMethods()
const staffService = require('../services/staffService')
const auth = require('../infrastructure/auth')
const constants = require('../infrastructure/constants')
const uuid = require('node-uuid')
const logger = require('../infrastructure/logger')
const basicAuth = require('koa-basic-auth')
const config = require('../infrastructure/config')

const BASE = '/staff'

//HR
router.post(
    `${BASE}/confirmgreenlight`,
    (ctx, next) => auth(ctx, next, [constants.UserRoles.HR]),
    async (ctx, next) => {
        const body = ctx.request.body

        const res = await staffService.confirmGreenLight(body, ctx)

        ctx.body = res

        logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, body })

        return await next()
    }
)

//BTT
router.post(
    `${BASE}/delete`,
    (ctx, next) => auth(ctx, next, [constants.UserRoles.BTT]),
    async (ctx, next) => {
        const body = ctx.request.body

        const res = await staffService.deleteStaff(body, ctx)

        ctx.body = res

        logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, body })

        return await next()
    }
)

router.post(`${BASE}/deletebyoriginalstaffid/basic`, basicAuth({ name: config.basicAuthUser, pass: config.basicAuthPassword }), async (ctx, next) => {
    const body = ctx.request.body

    const res = await staffService.deleteStaffByOriginalStaffId(body, ctx)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, body })

    return await next()
})

//BTT
router.post(
    `${BASE}/decline`,
    (ctx, next) => auth(ctx, next, [constants.UserRoles.BTT]),
    async (ctx, next) => {
        const body = ctx.request.body

        const res = await staffService.declineStaff(body, ctx)

        ctx.body = res

        logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, body })

        return await next()
    }
)

//BS && BTT
router.post(
    BASE,
    (ctx, next) => auth(ctx, next, [constants.UserRoles.BS, constants.UserRoles.BTT]),
    async (ctx, next) => {
        const body = ctx.request.body

        const res = await staffService.updateOrInsertStaff(body, ctx)

        ctx.body = res

        logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, body })

        return await next()
    }
)

router.post(`${BASE}/new`, auth, async (ctx, next) => {
    const body = ctx.request.body

    const res = await staffService.insertStaffFromGpx(body, ctx)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, body })

    return await next()
})

router.post(`${BASE}/new/basic`, basicAuth({ name: config.basicAuthUser, pass: config.basicAuthPassword }), async (ctx, next) => {
    const body = ctx.request.body

    const res = await staffService.insertStaffFromGpx(body, ctx)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, body })

    return await next()
})

router.post(`${BASE}/resign`, basicAuth({ name: config.basicAuthUser, pass: config.basicAuthPassword }), async (ctx, next) => {
    const body = ctx.request.body

    const res = await staffService.resign(body)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, body })

    return await next()
})

router.get(BASE, auth, async (ctx, next) => {
    const res = await staffService.getStaffs()

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: res.length })

    await next()
})

router.get(`${BASE}/count`, auth, async (ctx, next) => {
    const res = await staffService.getStaffCount()

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res })

    await next()
})

router.get(`${BASE}/getbystatus/:status`, auth, async (ctx, next) => {
    const status = ctx.params.status

    const res = await staffService.getStaffsByStatus(status)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: res.length, status })

    await next()
})

router.get(`${BASE}/getbygreenlight/:greenlight`, auth, async (ctx, next) => {
    const greenLight = ctx.params.greenlight

    const res = await staffService.getStaffsByGreenLight(greenLight)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: res.length, greenLight })

    await next()
})

router.get(`${BASE}/getbyidandgreenlight/:id/:greenlight`, auth, async (ctx, next) => {
    const id = ctx.params.id
    const greenLight = ctx.params.greenlight

    const res = await staffService.getStaffByIdAndGreenLight(id, greenLight)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, id, greenLight })

    await next()
})

router.get(`${BASE}/getbyid/:id`, auth, async (ctx, next) => {
    const id = ctx.params.id

    const res = await staffService.getStaffById(id)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, id })

    await next()
})

router.get(`${BASE}/:status/:id`, auth, async (ctx, next) => {
    const id = ctx.params.id
    const status = ctx.params.status

    const res = await staffService.getStaffByIdAndStatus(id, status)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, id, status })

    await next()
})

router.get(`${BASE}/model`, auth, async (ctx, next) => {
    const res = new constants.Staff()

    res.id = uuid.v1()

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res })

    await next()
})

module.exports = router
