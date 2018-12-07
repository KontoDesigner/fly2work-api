const mongo = require('../infrastructure/mongo')
const logger = require('tuin-logging')
const constants = require('../infrastructure/constants')
const bsValidation = require('../validations/bsValidation')
const bttValidation = require('../validations/bttValidation')
const newValidation = require('../validations/newValidation')
const declineValidation = require('../validations/declineValidation')
const email = require('../infrastructure/email')
const userService = require('./userService')
const helpers = require('../infrastructure/helpers')
const moment = require('moment')
const config = require('../infrastructure/config')
const uuid = require('node-uuid')

const confirmGreenLight = async (body, ctx) => {
    const id = body.id

    const user = userService.getUser(ctx)
    const userName = userService.getUserName(ctx, user)

    const getStaff = await mongo.collection('staffs').findOne({ id: id })

    const audit = {
        updatedBy: userName,
        statusFrom: getStaff ? getStaff.status : '',
        statusTo: getStaff ? getStaff.status : '',
        greenLightFrom: false,
        greenLightTo: true,
        date: new Date()
    }

    let replaceOne = {}

    try {
        replaceOne = (await mongo
            .collection('staffs')
            .updateOne({ id: id, greenLight: false }, { $push: { audit: audit }, $set: { greenLight: true } })).result
    } catch (err) {
        logger.error('Error confirming green light', err, id)

        return {
            ok: false,
            error: 'Confirm green light failed'
        }
    }

    logger.info('Confirm green light result', { url: ctx.url, id, replaceOne })

    return {
        ok: true
    }
}

const declineStaff = async (body, ctx) => {
    const model = {
        id: body.id,
        text: body.text
    }

    const validation = await declineValidation.validate(model, { abortEarly: false }).catch(function(err) {
        return err
    })

    if (validation.errors && validation.errors.length > 0) {
        logger.warning('Decline staff validation failed, aborting', { url: ctx.url, model, validation })

        return {
            ok: false,
            errors: validation.errors
        }
    }

    const user = userService.getUser(ctx)
    const userName = userService.getUserName(ctx, user)
    const userRoles = userService.getUserRoles(ctx, user)

    const comment = {
        text: model.text,
        id: uuid.v1(),
        created: moment()._d,
        createdBy: userName,
        group: userRoles.join(', ')
    }

    const getStaff = await mongo.collection('staffs').findOne({ id: id })

    const audit = {
        updatedBy: userName,
        greenLightFrom: getStaff ? getStaff.greenLight : '',
        greenLightTo: getStaff ? getStaff.greenLight : '',
        statusFrom: constants.Statuses.PendingBTT,
        statusTo: constants.Statuses.PendingDES,
        date: new Date()
    }

    let replaceOne = {}

    try {
        replaceOne = (await mongo
            .collection('staffs')
            .updateOne(
                { id: model.id, status: constants.Statuses.PendingBTT },
                { $push: { comments: comment, audit: audit }, $set: { status: constants.Statuses.PendingDES } }
            )).result
    } catch (err) {
        logger.error('Error declining staff', err, model)

        return {
            ok: false,
            error: 'Decline request failed'
        }
    }

    logger.info('Decline staff result', { url: ctx.url, model: model, replaceOne })

    return {
        ok: true
    }
}

const updateOrInsertStaff = async (body, ctx) => {
    const user = userService.getUser(ctx)
    const userName = userService.getUserName(ctx, user)
    const userRoles = userService.getUserRoles(ctx, user)
    const userEmail = userService.getUserEmail(ctx, user)

    let model = new constants.StaffBS()

    const add = body.add

    //BS
    model.arrivalAirports = body.arrivalAirports
    model.dateOfBirth = body.dateOfBirth
    model.preferredFlightDate = body.preferredFlightDate
    model.departureAirports = body.departureAirports
    model.destination = body.destination
    model.gender = body.gender
    model.hotelNeeded = body.hotelNeeded
    model.id = body.id
    model.firstName = body.firstName
    model.lastName = body.lastName
    model.lastName2 = body.lastName2
    model.passportNumber = body.passportNumber
    model.phone = body.phone
    model.sourceMarket = body.sourceMarket
    model.status = body.status
    model.plannedAssignmentStartDate = body.plannedAssignmentStartDate
    model.jobTitle = body.jobTitle
    model.bookReturnFlight = body.bookReturnFlight
    model.bookReturnFlightDateOfFlight = body.bookReturnFlightDateOfFlight
    model.bookReturnFlightDepartureAirport = body.bookReturnFlightDepartureAirport
    model.bookReturnFlightArrivalAirport = body.bookReturnFlightArrivalAirport
    model.railFly = body.railFly
    model.iataCode = body.iataCode
    model.typeOfFlight = body.typeOfFlight
    model.emails = body.emails

    let validation = null

    const getStaff = await mongo.collection('staffs').findOne({ id: model.id })

    var greenLightChanged = false

    if (userRoles.includes(constants.UserRoles.BTT)) {
        //BTT
        model = Object.assign(model, new constants.StaffBTT())

        model.bookingReference = body.bookingReference
        model.paymentMethod = body.paymentMethod
        model.luggage = body.luggage
        model.costCentre = body.costCentre
        model.travelType = body.travelType
        model.currency = body.currency
        model.railFlyRequestedAndBooked = body.railFlyRequestedAndBooked

        if (getStaff.greenLight === false && body.greenLight === true) {
            greenLightChanged = true
            model.greenLight = body.greenLight
            model.greenLightUpdated = new Date()
            model.greenLightUpdatedBy = userName
        } else {
            model.greenLight = getStaff.greenLight
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
                totalCost: flight.totalCost,
                confirmedFlightDate: flight.confirmedFlightDate,
                hotelNeededHotelName: flight.hotelNeededHotelName,
                hotelNeededHotelStart: flight.hotelNeededHotelStart,
                hotelNeededHotelEnd: flight.hotelNeededHotelEnd
            })
        }

        model.flights = flights

        validation = await bttValidation.validate(model, { abortEarly: false }).catch(function(err) {
            return err
        })
    } else {
        //BS
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

    //Should not be overwritten from request
    model.attachments = getStaff && getStaff.attachments ? getStaff.attachments : []
    model.created = getStaff ? getStaff.created : null
    model.createdBy = getStaff ? getStaff.createdBy : null
    model.createdByEmail = getStaff ? getStaff.createdByEmail : null
    model.comments = getStaff ? getStaff.comments : []
    model.audit = getStaff ? getStaff.audit : []

    if (add === true) {
        model = Object.assign(model, new constants.StaffBTT())

        if (getStaff) {
            logger.warning(`Staff with id: '${model.id}' already exists`, { url: ctx.url, model })

            return {
                ok: false,
                error: `Request with id: '${model.id}' already exists`
            }
        }

        model.created = moment().format('YYYY-MM-DD HH:mm')
        model.createdBy = userName
        model.createdByEmail = userEmail
        model.status = constants.Statuses.PendingBTT

        if (model.typeOfFlight === 'Start of season') {
            const greenLightDestinations = config.greenLightDestinations.split(',')
            model.greenLight = greenLightDestinations.includes(model.destination) ? false : null
        }

        let insertOne = {}

        try {
            insertOne = (await mongo.collection('staffs').insertOne(model)).result
        } catch (err) {
            logger.error('Error inserting staff', err, model)

            return {
                ok: false,
                error: 'Add request failed'
            }
        }

        logger.info('Insert staff result', { url: ctx.url, model, insertOne })

        if (insertOne.ok) {
            //Add createdBy and BTT to emails (NEW => PENDINGBTT)
            const statusText = `${constants.Statuses.New} => ${model.greenLight === false ? 'Pending HR' : constants.Statuses.PendingBTT}`

            //Get BTT to/cc based on sourceMarket
            let emails = helpers.getBTTEmails(model.sourceMarket)

            if (model.createdByEmail) {
                emails.to.push(model.createdByEmail)
            }

            //Add additional emails to email
            if (model.emails && model.emails.length > 0) {
                emails.to.push(model.emails)
            }

            const emailRes = await email.send(model, statusText, emails)

            if (emailRes === false) {
                return {
                    ok: false,
                    error: 'Request added but could not send email notification'
                }
            }
        }
    } else {
        model.audit.push({
            updatedBy: userName,
            greenLightFrom: getStaff.greenLight,
            greenLightTo: model.greenLight,
            statusFrom: getStaff.status,
            statusTo: model.status,
            date: new Date()
        })

        let replaceOne = {}

        try {
            replaceOne = (await mongo.collection('staffs').replaceOne({ id: model.id }, { $set: model })).result
        } catch (err) {
            logger.error('Error updating staff', err, model)

            return {
                ok: false,
                error: 'Update request failed'
            }
        }

        logger.info('Update staff result', { url: ctx.url, model, replaceOne })

        if (replaceOne.ok) {
            const statusText =
                greenLightChanged === false
                    ? `${getStaff.greenLight === false ? 'Pending HR' : getStaff.status} => ${
                          getStaff.greenLight === false ? 'Pending HR' : model.status
                      }`
                    : `Pending HR => ${model.status}`
            //Get BTT to/cc based on sourceMarket
            let emails = helpers.getBTTEmails(model.sourceMarket)

            //Add BTT and createdBy to emails (PENDINGBTT => CONFIRMED)
            if (getStaff.status === constants.Statuses.PendingBTT && model.status === constants.Statuses.Confirmed) {
                if (model.createdByEmail) {
                    emails.to.push(model.createdByEmail)
                }

                //Add additional emails to email
                if (model.emails && model.emails.length > 0) {
                    emails.to.push(model.emails)
                }

                if (emails.to.length > 0) {
                    const emailRes = await email.send(model, statusText, emails)

                    if (emailRes === false) {
                        return {
                            ok: false,
                            error: 'Request updated but could not send email notification'
                        }
                    }
                }
            }
            //Add BTT to emails (PENDINGDES => PendingBTT)
            else if (getStaff.status === constants.Statuses.PendingDES && model.status === constants.Statuses.PendingBTT) {
                //Add additional emails to email
                if (model.emails && model.emails.length > 0) {
                    emails.to.push(model.emails)
                }

                if (emails.to.length > 0) {
                    const emailRes = await email.send(model, statusText, emails)

                    if (emailRes === false) {
                        return {
                            ok: false,
                            error: 'Request updated but could not send email notification'
                        }
                    }
                }
            }
            //Add BTT and createdBy to emails (X => CONFIRMED)
            else if (model.status === constants.Statuses.Confirmed) {
                if (model.createdByEmail) {
                    emails.to.push(model.createdByEmail)
                }

                //Add additional emails to email
                if (model.emails && model.emails.length > 0) {
                    emails.to.push(model.emails)
                }

                if (emails.to.length > 0) {
                    const emailRes = await email.send(model, statusText, emails)

                    if (emailRes === false) {
                        return {
                            ok: false,
                            error: 'Request updated but could not send email notification'
                        }
                    }
                }
            }
        }
    }

    return {
        ok: true,
        greenLight: model.greenLight
    }
}

const insertStaff = async (body, ctx) => {
    const model = new constants.Staff()

    if (body.DateOfBirth) {
        const dateOfBirth = moment(body.DateOfBirth)
        const dateOfBirthValid = dateOfBirth.isValid()

        if (dateOfBirthValid === true) {
            model.dateOfBirth = moment(body.DateOfBirth).format('DD/MM/YYYY')
        }
    }

    const greenLightDestinations = config.greenLightDestinations.split(',')

    model.id = body.Id
    model.firstName = body.FirstName ? body.FirstName : ''
    model.lastName2 = body.LastName2 ? body.LastName2 : ''
    model.lastName = body.LastName ? body.LastName : ''
    model.sourceMarket = body.SourceMarket ? body.SourceMarket : ''
    model.phone = body.Phone ? body.Phone : ''
    model.status = constants.Statuses.New
    model.gender = body.Gender ? body.Gender : ''
    model.destination = body.Destination ? body.Destination : ''
    model.plannedAssignmentStartDate = body.PositionStart ? body.PositionStart : ''
    model.jobTitle = body.JobTitle ? body.JobTitle : ''
    model.iataCode = body.IataCode ? body.IataCode : ''
    model.greenLight = greenLightDestinations.includes(model.destination) ? false : null

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
    const staffs = await mongo
        .collection('staffs')
        .find({}, { fields: { status: 1, greenLight: 1, _id: 0 } })
        .toArray()

    const _new = staffs.filter(staff => staff.status === constants.Statuses.New)
    const pendingBTT = staffs.filter(
        staff => staff.status === constants.Statuses.PendingBTT && (staff.greenLight === null || staff.greenLight === true)
    )
    const pendingDES = staffs.filter(
        staff => staff.status === constants.Statuses.PendingDES && (staff.greenLight === null || staff.greenLight === true)
    )
    const confirmed = staffs.filter(
        staff => staff.status === constants.Statuses.Confirmed && (staff.greenLight === null || staff.greenLight === true)
    )
    const pendingHR = staffs.filter(staff => staff.status !== constants.Statuses.New && staff.greenLight === false)

    const count = {
        new: _new ? _new.length : 0,
        pendingHR: pendingHR ? pendingHR.length : 0,
        pendingBTT: pendingBTT ? pendingBTT.length : 0,
        pendingDES: pendingDES ? pendingDES.length : 0,
        confirmed: confirmed ? confirmed.length : 0,
        overview: null
    }

    count.overview = count.new + count.pendingBTT + count.pendingDES + count.confirmed + count.pendingHR

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
    let staffs = []

    if (status === constants.Statuses.New) {
        staffs = await mongo
            .collection('staffs')
            .find({ status: status })
            .toArray()
    } else {
        staffs = await mongo
            .collection('staffs')
            .find({ status: status, greenLight: { $ne: false } })
            .toArray()
    }

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: staffs.length })

    return staffs
}

const getStaffById = async (id, ctx) => {
    const staff = await mongo.collection('staffs').findOne({ id: id })

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count: staff ? 1 : 0 })

    return staff
}

const getStaffByIdAndStatus = async (id, status, ctx) => {
    let staff = null

    if (status === constants.Statuses.New) {
        staff = await mongo.collection('staffs').findOne({ id: id, status: status })
    } else {
        staff = await mongo.collection('staffs').findOne({ id: id, status: status, greenLight: { $ne: false } })
    }

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
    getStaffByIdAndGreenLight,
    declineStaff,
    confirmGreenLight
}
