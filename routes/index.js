const router = require('koa-better-router')().loadMethods()

router.extend(require('./health'))

module.exports = router.middleware()
