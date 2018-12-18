const router = require('koa-better-router')().loadMethods()
const commentService = require('../services/commentService')
const auth = require('../infrastructure/auth')
const logger = require('tuin-logging')

const BASE = '/comment'

router.post(`${BASE}/insert`, auth, async (ctx, next) => {
    const staffId = ctx.request.body.staffId
    const comment = ctx.request.body.comment

    const res = await commentService.insertComment(staffId, comment, ctx)

    ctx.body = res

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, res, staffId, comment })

    await next()
})

module.exports = router
