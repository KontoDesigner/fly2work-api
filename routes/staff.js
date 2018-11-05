const router = require('koa-better-router')().loadMethods()
const mongo = require('../infrastructure/mongo')
const logger = require('tuin-logging')
const constants = require('../infrastructure/constants')
const bsValidation = require('../validations/bsValidation')
const newValidation = require('../validations/newValidation')
const email = require('../infrastructure/email')

const BASE = '/staff'

router.post(BASE, async (ctx, next) => {
    const body = ctx.request.body

    const model = new constants.Staff()

    //BS
    model.arrivalAirport = body.arrivalAirport
    model.statusUpdated = new Date()
    model.dateOfBirth = body.dateOfBirth
    model.dateOfFlight = body.dateOfFlight
    model.departureAirport = body.departureAirport
    model.destination = body.destination
    model.gender = body.gender
    model.hotelNeeded = body.hotelNeeded
    model.id = body.id
    model.name = body.name
    model.phone = body.phone
    model.role = body.role
    model.roleConcept = body.roleConcept
    model.sourceMarket = body.sourceMarket
    model.status = body.status
    model.positionStart = body.positionStart
    model.typeOfFlight = body.typeOfFlight
    model.hotelNeededHotelStart = body.hotelNeededHotelStart
    model.hotelNeededHotelEnd = body.hotelNeededHotelEnd
    model.bookReturnFlight = body.bookReturnFlight
    model.bookReturnFlightDateOfFlight = body.bookReturnFlightDateOfFlight
    model.bookReturnFlightDepartureAirport = body.bookReturnFlightDepartureAirport
    model.bookReturnFlightArrivalAirport = body.bookReturnFlightArrivalAirport
    model.railFly = body.railFly

    //BTT
    model.flightNumber = body.flightNumber
    model.bookingReference = body.bookingReference
    model.arrivalTime = body.arrivalTime
    model.typeOfFlight = body.typeOfFlight
    model.typeOfFlight = body.typeOfFlight
    model.paymentMethod = body.paymentMethod
    model.xbag = body.xbag
    model.flightCost = body.flightCost
    model.xbagCost = body.xbagCost
    model.hotelCost = body.hotelCost
    model.totalCost = body.totalCost
    model.costCentre = body.costCentre

    //ALL
    model.comment = body.comment

    const validation = await bsValidation.validate(model, { abortEarly: false }).catch(function(err) {
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

    try {
        const replaceOne = (await mongo.collection('staffs').replaceOne({ id: model.id }, model)).result

        if (replaceOne.ok) {
            logger.info('Updated staff', { url: ctx.url, model, replaceOne })

            if (model.status === constants.Statuses.Confirmed) {
                await email.send(model)
            }

            ctx.body = {
                ok: true
            }

            return await next()
        }
    } catch (err) {
        logger.error('Error updating staff', err, params)
    }

    logger.warning('Update staff failed', { url: ctx.url, model, replaceOne })

    ctx.body = {
        ok: false,
        errors: ['Update staff failed']
    }

    return await next()
})

router.post(`${BASE}/new`, async (ctx, next) => {
    const body = ctx.request.body

    const model = new constants.Staff()

    model.id = body.Id
    model.name = body.Name
    model.dateOfBirth = body.DateOfBirth
    model.sourceMarket = body.SourceMarket
    model.phone = body.Phone
    model.status = constants.Statuses.New
    model.gender = body.Gender
    model.destination = body.Destination
    model.positionStart = body.PositionStart

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

    try {
        const replaceOne = await mongo.collection('staffs').replaceOne({ id: model.id }, model, { upsert: true })

        if (replaceOne.result.ok) {
            logger.info('Inserted staff', { url: ctx.url, model, replaceOne })

            const upserted = replaceOne.result.upserted ? true : false

            await email.send(model)

            ctx.body = {
                ok: true,
                upserted,
                id: upserted ? replaceOne.result.upserted[0]._id : (await mongo.collection('staffs').findOne({ id: model.id }))._id
            }

            return await next()
        }
    } catch (err) {
        logger.error('Error inserting staff', err, params)
    }

    logger.warning('Insert staff failed', { url: ctx.url, model, replaceOne })

    ctx.body = {
        ok: false,
        errors: ['Insert staff failed']
    }

    return await next()
})

router.get(BASE, async (ctx, next) => {
    const staffs = await mongo
        .collection('staffs')
        .find()
        .toArray()

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, staffs })

    ctx.body = staffs

    await next()
})

router.get(`${BASE}/count`, async (ctx, next) => {
    const res = await mongo
        .collection('staffs')
        .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
        .toArray()

    // const count = res.reduce(function(total, current) {
    //     total[current._id] = current.count
    //     return total
    // }, {})

    const _new = res.find(obj => obj._id === constants.Statuses.New)
    const submitted = res.find(obj => obj._id === constants.Statuses.Submitted)
    const pending = res.find(obj => obj._id === constants.Statuses.Pending)
    const confirmed = res.find(obj => obj._id === constants.Statuses.Confirmed)

    const count = {
        new: _new ? _new.count : 0,
        submitted: submitted ? submitted.count : 0,
        pending: pending ? pending.count : 0,
        confirmed: confirmed ? confirmed.count : 0,
        overview: null
    }

    count.overview = count.new + count.submitted + count.pending + count.confirmed

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count })

    ctx.body = count

    await next()
})

router.get(`${BASE}/getbystatus/:status`, async (ctx, next) => {
    const staffs = await mongo
        .collection('staffs')
        .find({ status: ctx.params.status })
        .toArray()

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, staffs })

    ctx.body = staffs

    await next()
})

router.get(`${BASE}/getbyid/:id`, async (ctx, next) => {
    const staffs = await mongo.collection('staffs').findOne({ id: ctx.params.id })

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, staffs })

    ctx.body = staffs

    await next()
})

router.get(`${BASE}/:status/:id`, async (ctx, next) => {
    const staff = await mongo.collection('staffs').findOne({ id: ctx.params.id, status: ctx.params.status })

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, staff })

    ctx.body = staff

    await next()
})

module.exports = router
