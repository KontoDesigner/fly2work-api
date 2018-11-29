const router = require('koa-better-router')().loadMethods()
const commentService = require('../services/commentService')
const passport = require('koa-passport')

const BASE = '/comment'

router.post(`${BASE}/insert`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
    const staffId = ctx.request.body.staffId
    const comment = ctx.request.body.comment

    const res = await commentService.insertComment(staffId, comment, ctx)

    ctx.body = res

    await next()
})

// router.post(`${BASE}/delete`, passport.authenticate('oauth-bearer', { session: false }), async (ctx, next) => {
//     const staffId = ctx.request.body.staffId
//     const commentId = ctx.request.body.commentId

//     const res = await commentService.deleteComment(staffId, commentId, ctx)

//     ctx.body = res

//     await next()
// })

module.exports = router
