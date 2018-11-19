const mongo = require('../infrastructure/mongo')
const logger = require('tuin-logging')
const constants = require('../infrastructure/constants')
const bsValidation = require('../validations/bsValidation')
const newValidation = require('../validations/newValidation')
const email = require('../infrastructure/email')
const uuid = require('node-uuid')
const moment = require('moment')

const updateStaff = async (body, ctx) => {
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
    model.firstName = body.firstName
    model.lastName = body.lastName
    model.passportNumber = body.passportNumber
    model.phone = body.phone
    model.sourceMarket = body.sourceMarket
    model.status = body.status
    model.positionStart = body.positionStart
    model.jobTitle = body.jobTitle
    model.typeOfFlight = body.typeOfFlight
    model.hotelNeededHotelStart = body.hotelNeededHotelStart
    model.hotelNeededHotelEnd = body.hotelNeededHotelEnd
    model.bookReturnFlight = body.bookReturnFlight
    model.bookReturnFlightDateOfFlight = body.bookReturnFlightDateOfFlight
    model.bookReturnFlightDepartureAirport = body.bookReturnFlightDepartureAirport
    model.bookReturnFlightArrivalAirport = body.bookReturnFlightArrivalAirport
    model.railFly = body.railFly
    model.iataCode = body.iataCode
    model.typeOfFlight = body.typeOfFlight

    //BTT
    model.bookingReference = body.bookingReference
    model.paymentMethod = body.paymentMethod
    model.xbag = body.xbag
    model.costCentre = body.costCentre
    model.travelType = body.travelType

    //Comments
    if (body.comments && body.comments.length > 0) {
        for (var comment of body.comments) {
            if (!comment.id) {
                comment.id = uuid.v1()
                comment.created = moment()._d
                comment.createdBy = 'TEST'
                comment.group = 'TEST'
            }
        }
    }

    model.comments = body.comments ? body.comments : []

    //Flights
    const flights = []

    for (var flight of body.flights) {
        flights.push({
            flightNumber: flight.flightNumber,
            flightDepartureTime: flight.flightDepartureTime,
            flightArrivalTime: flight.flightArrivalTime,
            departureAirport: flight.departureAirport,
            arrivalAirport: flight.arrivalAirport,
            flightCost: flight.flightCost,
            xbagCost: flight.xbagCost,
            hotelCost: flight.hotelCost,
            totalCost: flight.totalCost
        })
    }

    model.flights = flights

    const validation = await bsValidation.validate(model, { abortEarly: false }).catch(function(err) {
        return err
    })

    if (validation.errors && validation.errors.length > 0) {
        logger.warning('Staff model validation failed, aborting', { url: ctx.url, model, validation })

        return {
            ok: false,
            errors: validation.errors
        }
    }

    //Attachments
    const staffAttachments = await mongo.collection('staffs').findOne(
        {
            id: model.id
        },
        { fields: { attachments: 1, _id: 0 } }
    )

    model.attachments = staffAttachments && staffAttachments.attachments ? staffAttachments.attachments : []

    try {
        const replaceOne = (await mongo.collection('staffs').replaceOne({ id: model.id }, { $set: model })).result

        logger.info('Update staff result', { url: ctx.url, model, replaceOne })

        if (replaceOne.ok) {
            if (model.status === constants.Statuses.Confirmed) {
                await email.send(model)
            }

            return {
                ok: true
            }
        }
    } catch (err) {
        logger.error('Error updating staff', err, model)
    }

    return {
        ok: false,
        errors: ['Update staff failed']
    }
}

const insertStaff = async (body, ctx) => {
    const model = new constants.Staff()

    model.id = body.Id
    model.firstName = body.FirstName ? body.FirstName : ''
    model.lastName = body.LastName ? body.LastName : ''
    model.dateOfBirth = body.DateOfBirth ? body.DateOfBirth : ''
    model.sourceMarket = body.SourceMarket ? body.SourceMarket : ''
    model.phone = body.Phone ? body.Phone : ''
    model.status = constants.Statuses.New
    model.gender = body.Gender ? body.Gender : ''
    model.destination = body.Destination ? body.Destination : ''
    model.positionStart = body.PositionStart ? body.PositionStart : ''
    model.jobTitle = body.JobTitle ? body.JobTitle : ''
    model.iataCode = body.IataCode ? body.IataCode : ''

    const validation = await newValidation.validate(model, { abortEarly: false }).catch(function(err) {
        return err
    })

    if (validation.errors && validation.errors.length > 0) {
        logger.warning('Staff model validation failed, aborting', { url: ctx.url, model, validation })

        return {
            ok: false,
            errors: validation.errors
        }
    }

    try {
        const replaceOne = (await mongo.collection('staffs').replaceOne({ id: model.id }, model, { upsert: true })).result

        logger.info('Insert staff result', { url: ctx.url, model, replaceOne })

        if (replaceOne.ok) {
            const upserted = replaceOne.upserted ? true : false

            await email.send(model)

            return {
                ok: true,
                upserted,
                id: upserted ? replaceOne.upserted[0]._id : (await mongo.collection('staffs').findOne({ id: model.id }))._id
            }
        }
    } catch (err) {
        logger.error('Error inserting staff', err, model)
    }

    return {
        ok: false,
        errors: ['Insert staff failed']
    }
}

const getStaffs = async ctx => {
    const staffs = await mongo
        .collection('staffs')
        .find()
        .toArray()

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: staffs.length })

    return staffs
}

const getStaffCount = async ctx => {
    const res = await mongo
        .collection('staffs')
        .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
        .toArray()

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

    return count
}

const getStaffsByStatus = async (status, ctx) => {
    const staffs = await mongo
        .collection('staffs')
        .find({ status: status })
        .toArray()

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: staffs.length })

    return staffs
}

const getStaffById = async (id, ctx) => {
    const staff = await mongo.collection('staffs').findOne({ id: id })

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: staff ? 1 : 0 })

    return staff
}

const getStaffByIdAndStatus = async (id, status, ctx) => {
    const staff = await mongo.collection('staffs').findOne({ id: id, status: status })

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: staff ? 1 : 0 })

    return staff
}

module.exports = {
    updateStaff,
    insertStaff,
    getStaffs,
    getStaffCount,
    getStaffsByStatus,
    getStaffById,
    getStaffByIdAndStatus
}
