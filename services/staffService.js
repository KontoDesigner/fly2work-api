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
const gpxService = require('./gpxService')

const confirmGreenLight = async (body, ctx) => {
    const id = body.id

    const user = await userService.getUser(ctx)
    const userName = await userService.getUserName(ctx, user)
    const userRoles = await userService.getUserRoles(ctx, user)

    const getStaff = await mongo.collection('staffs').findOne({ id: id })

    const audit = {
        updatedBy: userName,
        statusFrom: getStaff ? getStaff.status : '',
        statusTo: getStaff ? getStaff.status : '',
        greenLightFrom: false,
        greenLightTo: true,
        group: userRoles.join(', '),
        date: new Date()
    }

    let replaceOne = {}

    try {
        replaceOne = (await mongo
            .collection('staffs')
            .updateOne(
                { id: id, greenLight: false },
                { $push: { audit: audit }, $set: { greenLight: true, greenLightUpdated: new Date(), greenLightUpdatedBy: userName } }
            )).result
    } catch (err) {
        logger.error('Error confirming green light', err, { url: ctx.url, id })

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

    const user = await userService.getUser(ctx)
    const userName = await userService.getUserName(ctx, user)
    const userRoles = await userService.getUserRoles(ctx, user)

    const comment = {
        text: model.text,
        id: uuid.v1(),
        created: moment()._d,
        createdBy: userName,
        group: userRoles.join(', ')
    }

    const getStaff = await mongo.collection('staffs').findOne({ id: model.id })

    const audit = {
        updatedBy: userName,
        greenLightFrom: getStaff ? getStaff.greenLight : null,
        greenLightTo: getStaff ? getStaff.greenLight : null,
        statusFrom: constants.Statuses.PendingBTT,
        statusTo: constants.Statuses.PendingDES,
        group: userRoles.join(', '),
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
        logger.error('Error declining staff', err, { url: ctx.url, model })

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

const insertStaffFromGpx = async (body, ctx) => {
    let model = new constants.Staff()

    const getStaff = await getStaffById(body.Id)

    if (getStaff && getStaff.status !== constants.Statuses.Confirmed) {
        const txt = `Request from GPX already exists, updating values and reverting status to: ${constants.Statuses.New}`

        logger.info(txt, {
            url: ctx.url,
            body,
            getStaff
        })

        model = getStaff

        if (getStaff.status !== constants.Statuses.New) {
            const comment = {
                text: txt,
                id: uuid.v1(),
                created: moment()._d,
                createdBy: 'SYSTEM',
                group: null
            }

            model.comments.push(comment)
        }
    }

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
    model.positionAssignId = body.PositionAssignId ? body.PositionAssignId : null

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

    if (getStaff && getStaff.status === constants.Statuses.Confirmed) {
        logger.info(`Request from GPX already exists with status: ${constants.Statuses.Confirmed}, allocating new request`, {
            url: ctx.url,
            body,
            getStaff
        })

        const comment = {
            text: `Request from GPX with id: ${model.id} already exists with status: ${constants.Statuses.Confirmed}, allocating new request.`,
            id: uuid.v1(),
            created: moment()._d,
            createdBy: 'SYSTEM',
            group: null
        }

        model.comments.push(comment)
        model.id = uuid.v1()
    }

    try {
        const replaceOne = (await mongo.collection('staffs').replaceOne({ id: model.id }, model, { upsert: true })).result

        logger.info('Insert staff from gpx result', { url: ctx.url, model, replaceOne })

        if (replaceOne.ok) {
            const upserted = replaceOne.upserted ? true : false

            return {
                ok: true,
                upserted,
                id: upserted ? replaceOne.upserted[0]._id : (await mongo.collection('staffs').findOne({ id: model.id }))._id
            }
        }
    } catch (err) {
        logger.error('Error inserting staff from gpx', err, { model, url: ctx.url })
    }

    return {
        ok: false,
        errors: ['Insert staff from gpx failed']
    }
}

const getStaffs = async () => {
    const staffs = await mongo
        .collection('staffs')
        .find()
        .toArray()

    return staffs
}

const getStaffCount = async () => {
    const staffs = await mongo
        .collection('staffs')
        .find({}, { projection: { status: 1, greenLight: 1, _id: 0 } })
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

    return count
}

const getStaffsByGreenLight = async greenLight => {
    const parseGreenLight = greenLight === 'true'

    const staffs = await mongo
        .collection('staffs')
        .find({ greenLight: parseGreenLight, status: { $ne: constants.Statuses.New } })
        .toArray()

    return staffs
}

const getStaffByIdAndGreenLight = async (id, greenLight) => {
    const parseGreenLight = greenLight === 'true'

    const staff = await mongo.collection('staffs').findOne({ id: id, greenLight: parseGreenLight })

    return staff
}

const getStaffsByStatus = async status => {
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

    return staffs
}

const getStaffById = async id => {
    const staff = await mongo.collection('staffs').findOne({ id: id })

    return staff
}

const getStaffByIdAndStatus = async (id, status) => {
    let staff = null

    if (status === constants.Statuses.New) {
        staff = await mongo.collection('staffs').findOne({ id: id, status: status })
    } else {
        staff = await mongo.collection('staffs').findOne({ id: id, status: status, greenLight: { $ne: false } })
    }

    return staff
}

const updateOrInsertStaff = async (body, ctx) => {
    const user = await userService.getUser(ctx)
    const userName = await userService.getUserName(ctx, user)
    const userRoles = await userService.getUserRoles(ctx, user)
    const userEmail = await userService.getUserEmail(ctx, user)

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
    model.comment = body.comment

    const btt = userRoles.includes(constants.UserRoles.BTT)

    if (btt === true && model.status === constants.Statuses.Confirmed) {
        model.confirmedStatus = body.confirmedStatus
    }

    let validation = null

    const getStaff = await mongo.collection('staffs').findOne({ id: model.id })

    if (btt) {
        //BTT
        model = Object.assign(model, new constants.StaffBTT())

        model.bookingReference = body.bookingReference
        model.paymentMethod = body.paymentMethod
        model.luggage = body.luggage
        model.costCentre = body.costCentre
        model.travelType = body.travelType
        model.currency = body.currency
        model.railFlyRequestedAndBooked = body.railFlyRequestedAndBooked

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
    model.requestedBy = getStaff ? getStaff.requestedBy : null
    if (add === true && model.comment && model.comment !== '') {
        const comment = {
            text: model.comment,
            id: uuid.v1(),
            created: moment()._d,
            createdBy: userName,
            group: userRoles.join(', ')
        }

        model.comments = [comment]
    } else {
        model.comments = getStaff ? getStaff.comments : []
    }
    delete model.comment
    model.audit = getStaff ? getStaff.audit : []
    model.positionAssignId = getStaff ? getStaff.positionAssignId : null
    if (model.status !== constants.Statuses.Confirmed || btt === false) {
        model.confirmedStatus = getStaff ? getStaff.confirmedStatus : null
    }
    model.greenLight = getStaff ? getStaff.greenLight : null

    if (add === true) {
        return await insertStaff(ctx, model, getStaff, userName, userEmail, btt)
    } else {
        return await updateStaff(ctx, model, getStaff, userName, userRoles, btt)
    }
}

async function insertStaff(ctx, model, getStaff, userName, userEmail, btt) {
    if (btt === false) {
        model = Object.assign(model, new constants.StaffBTT())
    }

    if (getStaff) {
        logger.warning(`Staff with id: '${model.id}' already exists`, { url: ctx.url, model })

        return {
            ok: false,
            error: `Request with id: '${model.id}' already exists`
        }
    }

    model.created = moment().format('YYYY-MM-DD HH:mm')
    model.requestedBy = {
        name: userName,
        email: userEmail
    }
    model.status = constants.Statuses.PendingBTT

    if (model.typeOfFlight === 'Start of season') {
        const greenLightDestinations = config.greenLightDestinations.split(',')
        model.greenLight = greenLightDestinations.includes(model.destination) ? false : null
    }

    let insertOne = {}

    try {
        insertOne = (await mongo.collection('staffs').insertOne(model)).result
    } catch (err) {
        logger.error('Error inserting staff', err, { model, url: ctx.url })

        return {
            ok: false,
            error: 'Add request failed'
        }
    }

    logger.info('Insert staff result', { url: ctx.url, model, insertOne })

    if (insertOne.ok === false) {
        return {
            ok: false,
            error: 'Add request failed'
        }
    }

    return await sendInsertEmails(ctx, model)
}

async function sendInsertEmails(ctx, model) {
    //Add createdBy and BTT to emails (NEW => PENDINGBTT)
    const statusText = `${constants.Statuses.New} => ${model.greenLight === false ? 'Pending HR' : constants.Statuses.PendingBTT}`

    //Get BTT to/cc based on sourceMarket
    let emails = helpers.getBTTEmails(model.sourceMarket)

    //Add BS
    if (model.requestedBy && model.requestedBy.email) {
        emails.to.push(model.requestedBy.email)
    }

    //Add HR
    if (model.greenLight === false) {
        emails.to.push(config.emailHR)
    }

    //Add additional emails
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

    logger.info('Insert staff successfull', { url: ctx.url, model })

    return {
        ok: true,
        greenLight: model.greenLight
    }
}

async function updateStaff(ctx, model, getStaff, userName, userRoles, btt) {
    if (btt === false && getStaff.status !== constants.Statuses.Confirmed && model.status === constants.Statuses.Confirmed) {
        logger.error('BS is trying to set request status to confirm', { url: ctx.url, getStaff, model })

        return {
            ok: false,
            error: 'Not allowed to set request status to confirm'
        }
    }

    model.audit.push({
        updatedBy: userName,
        greenLightFrom: getStaff.greenLight,
        greenLightTo: getStaff.greenLight,
        statusFrom: getStaff.status,
        statusTo: model.status,
        group: userRoles.join(', '),
        date: new Date()
    })

    let replaceOne = {}

    try {
        replaceOne = (await mongo.collection('staffs').replaceOne({ id: model.id }, { $set: model })).result
    } catch (err) {
        logger.error('Error updating staff', err, { model, url: ctx.url })

        return {
            ok: false,
            error: 'Update request failed'
        }
    }

    logger.info('Update staff result', { url: ctx.url, model, replaceOne })

    if (replaceOne.ok === false) {
        return {
            ok: false,
            error: 'Update request failed'
        }
    }

    return await sendUpdateEmailsAndConfirm(ctx, model, getStaff)
}

async function sendUpdateEmailsAndConfirm(ctx, model, getStaff) {
    const statusText = `${getStaff.greenLight === false ? 'Pending HR' : getStaff.status} => ${
        getStaff.greenLight === false ? 'Pending HR' : model.status
    }`

    //Get BTT to/cc based on sourceMarket
    let emails = helpers.getBTTEmails(model.sourceMarket)

    //Add HR
    if (getStaff.status === constants.Statuses.New && model.status !== constants.Statuses.New && model.greenLight === false) {
        emails.to.push(config.emailHR)
    }

    //Add BTT and createdBy to emails (PENDINGBTT => CONFIRMED) and send confirm date to gpx
    if (getStaff.status === constants.Statuses.PendingBTT && model.status === constants.Statuses.Confirmed) {
        //Send confirm date to GPX
        if (model.positionAssignId) {
            const confirmedDate = model.confirmedStatus === constants.ConfirmedStatuses.Cancelled ? null : moment()

            const confirmRes = await gpxService.confirm(model.positionAssignId, confirmedDate)

            if (confirmRes !== true) {
                return {
                    ok: false,
                    error: 'Request updated but could not send confirm to GPX or send email notifications'
                }
            }
        }

        //Add BS
        if (model.requestedBy && model.requestedBy.email) {
            emails.to.push(model.requestedBy.email)
        }

        //Add additional emails
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
        //Add additional emails
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
    //Add BTT and createdBy to emails (X => CONFIRMED) and send confirm date to gpx
    else if (model.status === constants.Statuses.Confirmed) {
        //Send confirm date to GPX
        if (model.positionAssignId) {
            const confirmedDate = model.confirmedStatus === constants.ConfirmedStatuses.Cancelled ? null : moment()

            const confirmRes = await gpxService.confirm(model.positionAssignId, confirmedDate)

            if (confirmRes !== true) {
                return {
                    ok: false,
                    error: 'Request updated but could not send confirm to GPX or send email notifications'
                }
            }
        }

        //Add BS
        if (model.requestedBy && model.requestedBy.email) {
            emails.to.push(model.requestedBy.email)
        }

        //Add additional emails
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

    logger.info('Update staff successfull', { url: ctx.url, model })

    return {
        ok: true,
        greenLight: getStaff.greenLight
    }
}

module.exports = {
    updateOrInsertStaff,
    insertStaffFromGpx,
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
