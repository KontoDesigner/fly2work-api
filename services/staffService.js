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
const helpers = require('../infrastructure/helpers')

const updateOrInsertStaff = async (body, ctx) => {
    const user = userService.getUser(ctx)
    const userName = userService.getUserName(ctx, user)
    const userRoles = userService.getUserRoles(ctx, user)
    const userEmail = userService.getUserEmail(ctx, user)

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
    model.lastName2 = body.lastName2
    model.passportNumber = body.passportNumber
    model.phone = body.phone
    model.sourceMarket = body.sourceMarket
    model.status = body.status
    model.positionStart = body.positionStart
    model.jobTitle = body.jobTitle
    model.hotelNeededHotelStart = body.hotelNeededHotelStart
    model.hotelNeededHotelEnd = body.hotelNeededHotelEnd
    model.bookReturnFlight = body.bookReturnFlight
    model.bookReturnFlightDateOfFlight = body.bookReturnFlightDateOfFlight
    model.bookReturnFlightDepartureAirport = body.bookReturnFlightDepartureAirport
    model.bookReturnFlightArrivalAirport = body.bookReturnFlightArrivalAirport
    model.railFly = body.railFly
    model.iataCode = body.iataCode
    model.typeOfFlight = body.typeOfFlight
    model.emails = body.emails

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

    const getStaff = await mongo.collection('staffs').findOne({ id: model.id })

    if (userRoles.includes(constants.UserRoles.BTT)) {
        //BTT
        model.bookingReference = body.bookingReference
        model.paymentMethod = body.paymentMethod
        model.xbag = body.xbag
        model.costCentre = body.costCentre
        model.travelType = body.travelType
        model.currency = body.currency

        if (getStaff.greenLight === false && body.greenLight === true) {
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
                dateOfFlight: flight.dateOfFlight
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

    //Attachments (should not be overwritten from request)
    model.attachments = getStaff && getStaff.attachments ? getStaff.attachments : []

    if (add === true) {
        if (getStaff) {
            logger.warning(`Staff with id: '${model.id}' already exists`, { url: ctx.url, model })

            return {
                ok: false,
                error: `Staff with id: '${model.id}' already exists`
            }
        } else {
            model.createdBy = userName
            model.createdByEmail = userEmail
            model.status = constants.Statuses.Submitted

            let insertOne = {}

            try {
                insertOne = (await mongo.collection('staffs').insertOne(model)).result
            } catch (err) {
                logger.error('Error inserting staff', err, model)

                return {
                    ok: false,
                    error: 'Add staff failed'
                }
            }

            logger.info('Insert staff result', { url: ctx.url, model, insertOne })

            if (insertOne.ok) {
                //Add createdBy and BTT to emails (NEW => SUBMITTED)
                const statusText = `${constants.Statuses.New} => ${constants.Statuses.Submitted}`

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
                        error: 'Staff added but could not send email notification'
                    }
                }
            }
        }
    } else {
        //Misc (should not be overwritten from request)
        model.createdBy = getStaff ? getStaff.createdBy : null
        model.createdByEmail = getStaff ? getStaff.createdByEmail : null

        let replaceOne = {}

        try {
            replaceOne = (await mongo.collection('staffs').replaceOne({ id: model.id }, { $set: model })).result
        } catch (err) {
            logger.error('Error updating staff', err, model)

            return {
                ok: false,
                error: 'Update staff failed'
            }
        }

        logger.info('Update staff result', { url: ctx.url, model, replaceOne })

        if (replaceOne.ok) {
            const statusText = `${getStaff.status} => ${model.status}`

            //Add BTT and createdBy to emails (SUBMITTED => CONFIRMED)
            if (getStaff.status === constants.Statuses.Submitted && model.status === constants.Statuses.Confirmed) {
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
                        error: 'Staff updated but could not send email notification'
                    }
                }
            }

            //Set emails to BTT only (PENDING => SUBMITTED)
            else if (getStaff.status === constants.Statuses.Pending && model.status === constants.Statuses.Submitted) {
                //Get BTT to/cc based on sourceMarket
                let emails = helpers.getBTTEmails(model.sourceMarket)

                //Add additional emails to email
                if (model.emails && model.emails.length > 0) {
                    emails.to.push(model.emails)
                }

                const emailRes = await email.send(model, statusText, emails)

                if (emailRes === false) {
                    return {
                        ok: false,
                        error: 'Staff updated but could not send email notification'
                    }
                }
            }

            //Add BTT and createdBy to emails (X => CONFIRMED)
            else if (model.status === constants.Statuses.Confirmed) {
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
                        error: 'Staff updated but could not send email notification'
                    }
                }
            }
        }
    }

    return {
        ok: true
    }
}

const insertStaff = async (body, ctx) => {
    const model = new constants.Staff()

    model.id = body.Id
    model.firstName = body.FirstName ? body.FirstName : ''
    model.lastName2 = body.LastName2 ? body.LastName2 : ''
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
    model.greenLight = body.GreenLight !== null && body.GreenLight !== undefined ? body.GreenLight : null

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
    getStaffByIdAndGreenLight
}
