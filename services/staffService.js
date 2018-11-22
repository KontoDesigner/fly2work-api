const mongo = require('../infrastructure/mongo')
const logger = require('tuin-logging')
const constants = require('../infrastructure/constants')
const bsValidation = require('../validations/bsValidation')
const bttValidation = require('../validations/bttValidation')
const newValidation = require('../validations/newValidation')
const email = require('../infrastructure/email')
const uuid = require('node-uuid')
const moment = require('moment')
const userService = require('./userService')

const updateOrInsertStaff = async (body, ctx) => {
    const user = userService.getUser(ctx)
    const userName = userService.getUserName(ctx, user)
    const userRoles = userService.getUserRoles(ctx, user)

    let model = new constants.StaffBS()

    const add = body.add

    //BS
    model.arrivalAirports = body.arrivalAirports
    model.updated = new Date()
    model.updatedBy = userName
    model.dateOfBirth = body.dateOfBirth
    model.dateOfFlight = body.dateOfFlight
    model.departureAirports = body.departureAirports
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

    //Comments
    if (body.comments && body.comments.length > 0) {
        for (var comment of body.comments) {
            if (!comment.id) {
                comment.id = uuid.v1()
                comment.created = moment()._d
                comment.createdBy = userName
                comment.group = userRoles.join(', ')
            }
        }
    }

    model.comments = body.comments ? body.comments : []

    let validation = null

    model = Object.assign(model, new constants.StaffBTT())

    if (userRoles.includes(constants.UserRoles.BTT)) {
        //BTT
        model.bookingReference = body.bookingReference
        model.paymentMethod = body.paymentMethod
        model.xbag = body.xbag
        model.costCentre = body.costCentre
        model.travelType = body.travelType

        const staffGreenLight = await mongo.collection('staffs').findOne(
            {
                id: model.id
            },
            { fields: { greenLight: 1, _id: 0 } }
        )

        if (staffGreenLight.greenLight === false && body.greenLight === true) {
            model.greenLight = body.greenLight
            model.greenLightUpdated = new Date()
            model.greenLightUpdatedBy = userName
        } else {
            model.greenLight = staffGreenLight.greenLight
        }

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

        validation = await bttValidation.validate(model, { abortEarly: false }).catch(function(err) {
            return err
        })
    } else {
        validation = await bsValidation.validate(model, { abortEarly: false }).catch(function(err) {
            return err
        })
    }

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
        if (add === true) {
            const staffExists = await mongo.collection('staffs').findOne({ id: model.id })

            if (staffExists) {
                logger.warning(`Staff with id: '${model.id}' already exists`, { url: ctx.url, model })

                return {
                    ok: false,
                    alreadyExists: true
                }
            } else {
                const insertOne = (await mongo.collection('staffs').insertOne(model)).result

                logger.info('Insert staff result', { url: ctx.url, model, insertOne })

                if (insertOne.ok) {
                    if (model.status === constants.Statuses.Confirmed) {
                        await email.send(model)
                    }

                    return {
                        ok: true
                    }
                }
            }
        } else {
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
        }
    } catch (err) {
        logger.error('Error updating/inserting staff', err, model)
    }

    return {
        ok: false,
        errors: ['Update/insert staff failed']
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
    model.greenLight = body.GreenLight ? body.GreenLight : null

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
    // const res = await mongo
    //     .collection('staffs')
    //     .aggregate([{ $match: { hr: { $ne: true } } }, { $group: { _id: '$status', count: { $sum: 1 } } }])
    //     .toArray()

    // const waitingForApproval = await mongo
    //     .collection('staffs')
    //     .find({ hr: true, status: { $ne: constants.Statuses.New } })
    //     .count()

    const staffs = await mongo
        .collection('staffs')
        .find({}, { fields: { status: 1, greenLight: 1, _id: 0 } })
        .toArray()

    const _new = staffs.filter(staff => staff.status === constants.Statuses.New)
    const submitted = staffs.filter(
        staff => staff.status === constants.Statuses.Submitted && (staff.greenLight === null || staff.greenLight === true)
    )
    const pending = staffs.filter(staff => staff.status === constants.Statuses.Pending && (staff.greenLight === null || staff.greenLight === true))
    const confirmed = staffs.filter(
        staff => staff.status === constants.Statuses.Confirmed && (staff.greenLight === null || staff.greenLight === true)
    )
    const waitingForApproval = staffs.filter(staff => staff.status !== constants.Statuses.New && staff.greenLight === false)

    const count = {
        new: _new ? _new.length : 0,
        waitingForApproval: waitingForApproval ? waitingForApproval.length : 0,
        submitted: submitted ? submitted.length : 0,
        pending: pending ? pending.length : 0,
        confirmed: confirmed ? confirmed.length : 0,
        overview: null
    }

    count.overview = count.new + count.submitted + count.pending + count.confirmed + count.waitingForApproval

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count })

    return count
}

const getStaffsByGreenLight = async (greenLight, ctx) => {
    const parseGreenLight = greenLight === 'true'

    const staffs = await mongo
        .collection('staffs')
        .find({ greenLight: parseGreenLight, status: { $ne: constants.Statuses.New } })
        .toArray()

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: staffs.length })

    return staffs
}

const getStaffByIdAndGreenLight = async (id, greenLight, ctx) => {
    const parseGreenLight = greenLight === 'true'

    const staff = await mongo.collection('staffs').findOne({ id: id, greenLight: parseGreenLight })

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: staff ? 1 : 0 })

    return staff
}

const getStaffsByStatus = async (status, ctx) => {
    const staffs = await mongo
        .collection('staffs')
        .find({ status: status, greenLight: { $ne: false } })
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
    const staff = await mongo.collection('staffs').findOne({ id: id, status: status, greenLight: { $ne: false } })

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: staff ? 1 : 0 })

    return staff
}

module.exports = {
    updateOrInsertStaff,
    insertStaff,
    getStaffs,
    getStaffCount,
    getStaffsByStatus,
    getStaffById,
    getStaffByIdAndStatus,
    getStaffsByGreenLight,
    getStaffByIdAndGreenLight
}
