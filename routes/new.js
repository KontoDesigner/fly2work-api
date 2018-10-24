const router = require('koa-better-router')().loadMethods()
const mongo = require('../mongo')
const newValidation = require('../validations/newValidation')
const logger = require('tuin-logging')

const BASE = '/new'

router.post(BASE, async (ctx, next) => {
    const body = ctx.request.body

    const model = {
        arrivalAirport: body.arrivalAirport,
        comment: body.comment,
        confirmedDate: body.confirmedDate,
        dateOfBirth: body.dateOfBirth,
        dateOfFlight: body.dateOfFlight,
        departureAirport: body.departureAirport,
        destination: body.destination,
        gender: body.gender,
        hotelNeeded: body.hotelNeeded,
        id: body.id,
        name: body.name,
        passportName: body.passportName,
        phone: body.phone,
        role: body.role,
        season: body.season,
        sourceMarket: body.sourceMarket,
        startDate: body.startDate,
        status: body.status,
        statusOfFlight: body.statusOfFlight,
        typeOfFlight: body.typeOfFlight
    }

    const validation = await newValidation.validate(model, { abortEarly: false }).catch(function(err) {
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

    const updateOne = (await mongo.collection('staffs').updateOne({ id: model.id }, { $set: { status: model.status } })).result

    if (updateOne.ok) {
        logger.info('Updated staff', { url: ctx.url, model, updateOne })

        ctx.body = {
            ok: true
        }

        return await next()
    }

    logger.warning('Update staff failed', { url: ctx.url, model, updateOne })

    ctx.body = {
        ok: false,
        errors: ['Update staff failed']
    }

    return await next()
})

module.exports = router
