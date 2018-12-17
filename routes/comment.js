const router = require('koa-better-router')().loadMethods()
const commentService = require('../services/commentService')
const auth = require('../infrastructure/auth')

const BASE = '/comment'

router.post(`${BASE}/insert`, auth, async (ctx, next) => {
    const staffId = ctx.request.body.staffId
    const comment = ctx.request.body.comment

    const res = await commentService.insertComment(staffId, comment, ctx)

    ctx.body = res

    await next()
})

module.exports = router
