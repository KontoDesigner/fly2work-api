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
        logger.warning('Staff model validation failed, aborting', { model, validation })

        ctx.body = {
            ok: false,
            errors: validation.errors
        }

        return await next()
    }

    const insertOne = await mongo.collection('staffs').insertOne(model)

    if (insertOne.result.ok) {
        logger.info('New staff inserted', { model, insertOne })

        ctx.body = {
            ok: true,
            id: insertOne.insertedIds
        }

        return await next()
    }

    logger.warning('Mongo insert returned ok:false', { model, insertOne })

    ctx.body = {
        ok: false,
        errors: ['Mongo insert returned ok:false']
    }

    return await next()
})

module.exports = router
