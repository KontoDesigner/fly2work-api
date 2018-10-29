const router = require('koa-better-router')().loadMethods()
const mongo = require('../infrastructure/mongo')
const logger = require('tuin-logging')
const constants = require('../infrastructure/constants')
const staffValidation = require('../validations/staffValidation')
const gpxValidation = require('../validations/gpxValidation')

const BASE = '/staff'

router.post(BASE, async (ctx, next) => {
    const body = ctx.request.body

    const model = new constants.Staff()

    model.arrivalAirport = body.arrivalAirport
    model.comment = body.comment
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
    model.sourceMarket = body.sourceMarket
    model.status = body.status
    model.positionStart = body.positionStart
    model.typeOfFlight = body.typeOfFlight
    if (model.hotelNeeded === true) {
        model.hotelStart = body.hotelStart
        model.hotelEnd = body.hotelEnd
    }

    const validation = await staffValidation.validate(model, { abortEarly: false }).catch(function(err) {
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

    const replaceOne = (await mongo.collection('staffs').replaceOne({ id: model.id }, model)).result

    if (replaceOne.ok) {
        logger.info('Updated staff', { url: ctx.url, model, replaceOne })

        ctx.body = {
            ok: true
        }

        return await next()
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
