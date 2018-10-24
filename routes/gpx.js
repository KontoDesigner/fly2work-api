const router = require('koa-better-router')().loadMethods()
const mongo = require('../mongo')
const gpxValidation = require('../validations/gpxValidation')
const logger = require('tuin-logging')
const constants = require('../constants')

const BASE = '/gpx'

router.post(BASE, async (ctx, next) => {
    const body = ctx.request.body

    const model = {
        id: body.Id,
        name: body.Name,
        dateOfBirth: body.DateOfBirth,
        sourceMarket: body.SourceMarket,
        phone: body.Phone,
        status: constants.Statuses.New,
        gender: body.Gender,
        destination: body.Destination,
        positionStart: body.PositionStart
    }

    const validation = await gpxValidation.validate(model, { abortEarly: false }).catch(function(err) {
        return err
    })

    if (validation.errors && validation.errors.length > 0) {
        logger.warning('Staff model validation failed, aborting', { url: ctx.url, model, validation })

        ctx.body = {
            ok: false,
            errors: validation.errors
        }

        return await next()
    }

    const insertOne = await mongo.collection('staffs').insertOne(model)

    if (insertOne.result.ok) {
        logger.info('Inserted staff', { url: ctx.url, model, insertOne })

        ctx.body = {
            ok: true,
            id: insertOne.insertedIds
        }

        return await next()
    }

    logger.warning('Insert staff failed', { url: ctx.url, model, insertOne })

    ctx.body = {
        ok: false,
        errors: ['Insert staff failed']
    }

    return await next()
})

module.exports = router
