const router = require('koa-better-router')().loadMethods()
const mongo = require('../mongo')
const staffValidation = require('../validations/staffValidation')
const logger = require('tuin-logging')

router.get('/staff/:id', async (ctx, next) => {
    ctx.body = {
        ok: true
    }

    await next()
})

router.post('/staff', async (ctx, next) => {
    const body = ctx.request.body

    const model = {
        name: body.name
    }

    const validation = await staffValidation.validate(model, { abortEarly: false }).catch(function(err) {
        return err
    })

    if (validation.errors !== undefined && validation.errors.length > 0) {
        logger.warning('Staff schema validation failed, aborting', model)

        ctx.body = {
            ok: false,
            errors: validation.errors
        }

        return await next()
    }

    // await mongo
    //     .collection('tips')
    //     .find({ brandid: ctx.params.brandid })
    //     .project({ id: 1, numberOfItems: 1 })
    //     .toArray()

    ctx.body = {
        ok: true
    }

    return await next()
})

module.exports = router
