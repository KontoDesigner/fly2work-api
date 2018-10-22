const router = require('koa-better-router')().loadMethods()
const mongo = require('../mongo')
const logger = require('tuin-logging')

const BASE = '/staff'

router.get(BASE, async (ctx, next) => {
    logger.info(`Returning ${BASE} [GET]`, { staffs: null })

    ctx.body = {
        ok: true
    }

    await next()
})

router.get(`${BASE}/:id`, async (ctx, next) => {
    logger.info(`Returning ${BASE}/:id [GET]`, { staff: null })

    ctx.body = {
        ok: true
    }

    await next()
})

module.exports = router
