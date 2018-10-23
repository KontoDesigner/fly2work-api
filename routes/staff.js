const router = require('koa-better-router')().loadMethods()
const mongo = require('../mongo')
const logger = require('tuin-logging')

const BASE = '/staff'

router.get(BASE, async (ctx, next) => {
    const staffs = await mongo
        .collection('staffs')
        .find({ status: ctx.params.status })
        .toArray()

    logger.info(`Returning ${BASE} [GET]`, { staffs })

    ctx.body = {
        staffs: staffs
    }

    await next()
})

router.get(`${BASE}/count`, async (ctx, next) => {
    const staffs = await mongo.collection('staffs').group({
        key: { status: 1 }
    })

    logger.info(`Returning ${BASE}/:id [GET]`, { staffs })

    await next()
})

router.get(`${BASE}/:id`, async (ctx, next) => {
    const staff = await mongo
        .collection('staffs')
        .findOnde({ id: ctx.params.id })
        .toArray()

    logger.info(`Returning ${BASE}/:id [GET]`, { staff })

    ctx.body = {
        staff: staff
    }

    await next()
})

module.exports = router
