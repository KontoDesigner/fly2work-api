const router = require('koa-better-router')().loadMethods()
const mongo = require('../mongo')
const staffValidation = require('../validations/staffValidation')
const logger = require('tuin-logging')

const BASE = '/gpx'

router.post(BASE, async (ctx, next) => {
    const body = ctx.request.body

    console.log('asdf', body)

    const model = {
        id: body.Id,
        name: body.Name,
        dateOfBirth: body.DateOfBirth,
        sourceMarket: body.SourceMarket,
        phone: body.Phone,
        status: 'New'
    }

    const validation = await staffValidation.validate(model, { abortEarly: false }).catch(function(err) {
        return err
    })

    if (validation.errors && validation.errors.length > 0) {
        logger.warning('Staff model validation failed, aborting', { model, validation })

        ctx.body = {
            ok: false,
            errors: validation.errors
        }

        return await next()
    }

    const insertOne = await mongo.collection('staffs').insertOne(model)

    if (insertOne.result.ok) {
        logger.info('Staff inserted', { model, insertOne })

        ctx.body = {
            ok: true,
            id: insertOne.insertedIds
        }

        return await next()
    }

    logger.warning('Staff insert returned ok:false', { model, insertOne })

    ctx.body = {
        ok: false,
        errors: ['Staff insert returned ok:false']
    }

    return await next()
})

module.exports = router
