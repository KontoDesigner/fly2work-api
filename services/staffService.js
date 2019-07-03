const mongo = require('../infrastructure/mongo')
const logger = require('../infrastructure/logger')
const constants = require('../infrastructure/constants')
const bsValidation = require('../validations/bsValidation')
const bttValidation = require('../validations/bttValidation')
const newValidation = require('../validations/newValidation')
const declineValidation = require('../validations/declineValidation')
const resignValidation = require('../validations/resignValidation')
const resignNewRequestValidation = require('../validations/resignNewRequestValidation')
const deleteStaffValidation = require('../validations/deleteStaffValidation')
const deleteStaffByPositionAssignIdValidation = require('../validations/deleteStaffByPositionAssignIdValidation')
const email = require('../infrastructure/email')
const userService = require('./userService')
const helpers = require('../infrastructure/helpers')
const moment = require('moment')
const config = require('../infrastructure/config')
const uuid = require('node-uuid')
const gpxService = require('./gpxService')

const resign = async body => {
    const model = {
        originalStaffId: body.originalStaffId,
        lastWorkingDay: body.lastWorkingDay,
        resign: body.resign
    }

    const validation = await resignValidation.validate(model, { abortEarly: false }).catch(function(err) {
        return err
    })

    if (validation.errors && validation.errors.length > 0) {
        logger.warning('resign validation failed, aborting', { model })

        return [
            {
                ok: false,
                error: validation.errors
            }
        ]
    }

    const staffs = await mongo
        .collection('staffs')
        .find({ originalStaffId: model.originalStaffId, typeOfFlight: { $ne: 'Resignation' } }, { projection: { _id: 0 } })
        .toArray()

    const res = []

    const now = moment()

    if (staffs.length === 0) {
        const plannedAssignmentStartDate = moment(model.resign.PositionStart)
        const confirmedFlightDate = moment(model.resign.ConfirmedFlightDate)

        //New request
        if (
            model.resign &&
            model.resign.ConfirmedFlightDate &&
            model.resign.PositionStart &&
            now.isAfter(plannedAssignmentStartDate, 'day') &&
            now.isAfter(confirmedFlightDate, 'day')
        ) {
            logger.info('found no requests for resign, creating a new staff resign request', { model })

            let resign = new constants.Staff()
            resign.id = uuid.v1()
            resign.created = moment()._d
            resign.originalStaffId = model.resign.Id
            resign.direction = model.resign.Direction
            resign.firstName = model.resign.FirstName ? model.resign.FirstName : ''
            resign.lastName2 = model.resign.LastName2 ? model.resign.LastName2 : ''
            resign.lastName = model.resign.LastName ? model.resign.LastName : ''
            resign.sourceMarket = model.resign.SourceMarket ? model.resign.SourceMarket : ''
            resign.phone = model.resign.Phone ? model.resign.Phone : ''
            resign.status = constants.Statuses.New
            resign.gender = model.resign.Gender ? model.resign.Gender : ''
            resign.destination = model.resign.Destination ? model.resign.Destination : ''
            resign.jobTitle = model.resign.JobTitle ? model.resign.JobTitle : ''
            resign.iataCode = model.resign.IataCode ? model.resign.IataCode : ''
            resign.greenLight = null
            resign.positionAssignId = model.resign.PositionAssignId ? model.resign.PositionAssignId : null
            resign.typeOfFlight = model.resign.TypeOfFlight ? model.resign.TypeOfFlight : ''

            if (model.lastWorkingDay) {
                resign.preferredFlightDate = moment(model.lastWorkingDay).format('DD/MM/YYYY')
            } else {
                resign.preferredFlightDate = ''
            }

            if (model.resign.DateOfBirth) {
                const dateOfBirth = moment(model.resign.DateOfBirth)
                const dateOfBirthValid = dateOfBirth.isValid()

                if (dateOfBirthValid === true) {
                    resign.dateOfBirth = moment(model.resign.DateOfBirth).format('DD/MM/YYYY')
                }
            }

            const validation = await resignNewRequestValidation.validate(resign, { abortEarly: false }).catch(function(err) {
                return err
            })

            if (validation.errors && validation.errors.length > 0) {
                logger.warning('Staff model validation failed, aborting new resign request', { model, validation })

                res.push({
                    ok: false,
                    originalStaffId: model.resign.Id,
                    id: '',
                    type: 'resign - new request (no copy)',
                    errors: validation.errors
                })

                return res
            }

            try {
                const insertOne = (await mongo.collection('staffs').insertOne(resign)).result

                logger.info('Insert new resign request result', { resign, insertOne })

                if (insertOne.ok) {
                    res.push({
                        ok: true,
                        originalStaffId: model.resign.Id,
                        id: '',
                        type: 'resign - new request  (no copy)'
                    })
                } else {
                    logger.warning('Could not insert new resign request', { insertOne, resign })

                    res.push({
                        ok: false,
                        originalStaffId: model.resign.Id,
                        id: '',
                        type: 'resign - new request  (no copy)',
                        errors: ['Could not insert new resign request']
                    })
                }
            } catch (err) {
                logger.error('Error inserting new resign request', err, { resign })

                res.push({
                    ok: false,
                    originalStaffId: model.resign.Id,
                    id: '',
                    type: 'resign - new request  (no copy)',
                    errors: err
                })
            }
        } else {
            logger.info('found no request for resign, staff not eligible for new resign request', {
                model,
                staffs,
                plannedAssignmentStartDate,
                confirmedFlightDate
            })
        }

        return res
    }

    logger.info('found staffs for resign', { model, staffs })

    for (var staff of staffs) {
        const plannedAssignmentStartDate = moment(staff.plannedAssignmentStartDate, 'DD/MM/YYYY', true)
        let confirmedFlightDate = null

        if (staff.flights[0] && staff.flights[0].confirmedFlightDate && staff.flights[0].confirmedFlightDate !== '') {
            confirmedFlightDate = moment(staff.flights[0].confirmedFlightDate, 'DD/MM/YYYY', true)
        }

        const confirmed = staff.status === constants.Statuses.Confirmed && (staff.greenLight === null || staff.greenLight === true)

        if (confirmed === true && confirmedFlightDate !== null && now.isBefore(confirmedFlightDate, 'day')) {
            //Move to pending BTT and add a comment
            logger.info('resign - move confirmed to pendingbtt and add a comment', { staff, model, confirmedFlightDate })

            let replaceOne = {}

            staff.status = constants.Statuses.PendingBTT

            staff.comments.push({
                text: 'Cancel flight ticket due to resignation',
                id: uuid.v1(),
                created: moment()._d,
                createdBy: 'SYSTEM',
                group: ''
            })
            staff.audit.push({
                updatedBy: 'SYSTEM',
                greenLightFrom: staff.greenLight,
                greenLightTo: staff.greenLight,
                statusFrom: staff.status,
                statusTo: constants.Statuses.PendingBTT,
                group: '',
                date: new Date()
            })

            try {
                replaceOne = (await mongo.collection('staffs').replaceOne({ id: staff.id }, { $set: staff })).result
            } catch (err) {
                logger.error('resign - move confirmed to pendingbtt and add a comment error', err, { model, staff, confirmedFlightDate })

                res.push({
                    ok: false,
                    originalStaffId: staff.originalStaffId,
                    id: staff.id,
                    error: err.message,
                    type: 'resign - move confirmed to pendingbtt and add a comment'
                })

                continue
            }

            logger.info('resign - move confirmed to pendingbtt and add a comment result', { model, staff, confirmedFlightDate, replaceOne })

            if (replaceOne.ok === false) {
                res.push({
                    ok: false,
                    originalStaffId: staff.originalStaffId,
                    id: staff.id,
                    error: 'replaceOne.ok === false',
                    type: 'resign - move confirmed to pendingbtt and add a comment'
                })
            } else {
                res.push({
                    ok: true,
                    originalStaffId: staff.originalStaffId,
                    id: staff.id,
                    type: 'resign - move confirmed to pendingbtt and add a comment'
                })
            }
        } else if (now.isAfter(plannedAssignmentStartDate, 'day') && confirmedFlightDate !== null && now.isAfter(confirmedFlightDate, 'day')) {
            //New request with same data but with end of season + Preffered Flight Date = Last Working Day
            logger.info('resign - new request', { model, staff, confirmedFlightDate })

            const newStaff = new constants.Staff()

            newStaff.id = uuid.v1()
            newStaff.created = moment()._d
            newStaff.typeOfFlight = 'Resignation'
            newStaff.status = constants.Statuses.New
            newStaff.direction = 'Departing'
            newStaff.dateOfBirth = staff.dateOfBirth
            newStaff.positionStart = staff.positionStart
            newStaff.originalStaffId = staff.originalStaffId
            newStaff.firstName = staff.firstName
            newStaff.lastName2 = staff.lastName2
            newStaff.lastName = staff.lastName
            newStaff.sourceMarket = staff.sourceMarket
            newStaff.phone = staff.phone
            newStaff.gender = staff.gender
            newStaff.destination = staff.destination
            newStaff.jobTitle = staff.jobTitle
            newStaff.iataCode = staff.iataCode
            newStaff.greenLight = staff.greenLight
            newStaff.positionAssignId = staff.positionAssignId

            if (model.lastWorkingDay) {
                newStaff.preferredFlightDate = moment(model.lastWorkingDay).format('DD/MM/YYYY')
            } else {
                newStaff.preferredFlightDate = ''
            }

            let insertOne = {}

            try {
                insertOne = (await mongo.collection('staffs').insertOne(newStaff)).result
            } catch (err) {
                logger.error('resign - new request error', err, { model, staff, newStaff, confirmedFlightDate })

                res.push({
                    ok: false,
                    originalStaffId: staff.originalStaffId,
                    id: newStaff.id,
                    error: err.message,
                    type: 'resign - new request'
                })

                continue
            }

            logger.info('resign - new request result', { model, staff, newStaff, confirmedFlightDate, insertOne })

            if (insertOne.ok === false) {
                res.push({
                    ok: false,
                    originalStaffId: staff.originalStaffId,
                    id: newStaff.id,
                    error: 'Add request failed',
                    type: 'resign - new request'
                })
            } else {
                res.push({
                    ok: true,
                    originalStaffId: staff.originalStaffId,
                    id: newStaff.id,
                    type: 'resign - new request'
                })
            }
        } else if (confirmed === false) {
            //Remove request
            logger.info('resign - remove pending', { model, staff, confirmedFlightDate })

            let remove = {}

            try {
                remove = (await mongo.collection('staffs').deleteOne({ id: staff.id })).result
            } catch (err) {
                logger.error('resign - remove pending error', err, { model, staff, confirmedFlightDate })

                res.push({
                    ok: false,
                    originalStaffId: staff.originalStaffId,
                    id: staff.id,
                    error: err.message,
                    type: 'resign - remove pending'
                })

                continue
            }

            logger.info('resign - remove pending result', { model, staff, confirmedFlightDate, remove })

            res.push({
                ok: true,
                originalStaffId: staff.originalStaffId,
                id: staff.id,
                type: 'resign - remove pending'
            })
        }
    }

    return res
}

const deleteStaff = async (body, ctx) => {
    const model = {
        id: body.id
    }

    const user = await userService.getUser(ctx)

    const validation = await deleteStaffValidation.validate(model, { abortEarly: false }).catch(function(err) {
        return err
    })

    if (validation.errors && validation.errors.length > 0) {
        logger.info('delete staff validation failed, aborting', { url: ctx.url, model, validation, user })

        return {
            ok: false,
            error: validation.errors
        }
    }

    const getStaff = await mongo.collection('staffs').findOne({ id: model.id })

    let remove = {}

    try {
        remove = (await mongo.collection('staffs').deleteOne({ id: model.id })).result
    } catch (err) {
        logger.error('Error deleting staff', err, { url: ctx.url, model, user, getStaff })

        return {
            ok: false,
            error: 'Delete staff failed'
        }
    }

    logger.info('Delete staff result', { url: ctx.url, model, remove, user, getStaff })

    return {
        ok: true
    }
}

const deleteStaffByPositionAssignId = async (body, ctx) => {
    const model = {
        positionAssignId: body.positionAssignId
    }

    const validation = await deleteStaffByPositionAssignIdValidation.validate(model, { abortEarly: false }).catch(function(err) {
        return err
    })

    const res = []

    if (validation.errors && validation.errors.length > 0) {
        logger.info('delete staff by original staff id validation failed, aborting', { url: ctx.url, model, validation })

        res.push({
            ok: false,
            error: validation.errors
        })

        return res
    }

    const staffs = await mongo
        .collection('staffs')
        .find({ positionAssignId: model.positionAssignId }, { projection: { attachments: 0 } })
        .toArray()

    if (staffs.length === 0) {
        return res
    }

    logger.info('found staffs for delete staff by original staff id', { model, staffs })

    for (var staff of staffs) {
        let remove = {}

        try {
            remove = (await mongo.collection('staffs').deleteOne({ id: staff.id })).result
        } catch (err) {
            logger.error('delete staff by original staff id error', err, { url: ctx.url, model, staff })

            res.push({
                ok: false,
                error: 'delete staff by original staff id failed',
                positionAssignId: staff.positionAssignId,
                id: staff.id
            })
        }

        logger.info('delete staff by original staff id result', { url: ctx.url, model, remove, staff })

        res.push({
            ok: true,
            positionAssignId: staff.positionAssignId,
            id: staff.id
        })
    }

    return res
}

const confirmGreenLight = async (body, ctx) => {
    const id = body.id

    const user = await userService.getUser(ctx)

    const getStaff = await mongo.collection('staffs').findOne({ id: id })

    const audit = {
        updatedBy: user.name,
        statusFrom: 'PendingHR',
        statusTo: getStaff ? getStaff.status : '',
        greenLightFrom: false,
        greenLightTo: true,
        group: user.roles.join(', '),
        date: new Date()
    }

    let replaceOne = {}

    try {
        replaceOne = (await mongo.collection('staffs').updateOne(
            { id: id, greenLight: false },
            {
                $push: { audit: audit },
                $set: {
                    greenLight: true,
                    greenLightUpdated: moment().format('DD/MM/YYYY HH:mm'),
                    greenLightUpdatedBy: user.name,
                    greenLightUpdatedByEmail: user.email
                }
            }
        )).result
    } catch (err) {
        logger.error('Error confirming green light', err, { url: ctx.url, id, user })

        return {
            ok: false,
            error: 'Confirm green light failed'
        }
    }

    logger.info('Confirm green light result', { url: ctx.url, id, replaceOne, user })

    if (getStaff.status === constants.Statuses.PendingBTT) {
        let emails = helpers.getBTTEmails(getStaff.sourceMarket)

        //Add BS
        if (getStaff.requestedBy && getStaff.requestedBy.email) {
            emails.to.push(getStaff.requestedBy.email)
        }

        //Add additional emails
        if (getStaff.emails && getStaff.emails.length > 0) {
            emails.to.push(...getStaff.emails)
        }

        if (emails.to.length > 0) {
            const statusText = `PendingHR => ${getStaff.status}`

            getStaff.greenLight = true

            const emailRes = await email.send(getStaff, statusText, emails)

            if (emailRes === false) {
                return {
                    ok: false,
                    error: 'Confirmed green light but could not send email notification'
                }
            }
        }
    }

    return {
        ok: true
    }
}

const declineStaff = async (body, ctx) => {
    const user = await userService.getUser(ctx)

    const model = {
        id: body.id,
        text: body.text
    }

    const validation = await declineValidation.validate(model, { abortEarly: false }).catch(function(err) {
        return err
    })

    if (validation.errors && validation.errors.length > 0) {
        logger.info('Decline staff validation failed, aborting', { url: ctx.url, model, validation, user })

        return {
            ok: false,
            errors: validation.errors
        }
    }

    const comment = {
        text: model.text,
        id: uuid.v1(),
        created: moment()._d,
        createdBy: user.name,
        group: user.roles.join(', ')
    }

    const getStaff = await mongo.collection('staffs').findOne({ id: model.id })

    const audit = {
        updatedBy: user.name,
        greenLightFrom: getStaff ? getStaff.greenLight : null,
        greenLightTo: getStaff ? getStaff.greenLight : null,
        statusFrom: constants.Statuses.PendingBTT,
        statusTo: constants.Statuses.PendingDES,
        group: user.roles.join(', '),
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
        logger.error('Error declining staff', err, { url: ctx.url, model, user })

        return {
            ok: false,
            error: 'Decline request failed'
        }
    }

    logger.info('Decline staff result', { url: ctx.url, model: model, replaceOne, user })

    let emails = helpers.getBTTCC()

    //Add BS
    if (model.requestedBy && model.requestedBy.email) {
        emails.to.push(model.requestedBy.email)
    }

    //Add additional emails
    if (model.emails && model.emails.length > 0) {
        emails.to.push(...model.emails)
    }

    const getStaffAfterUpdate = await mongo.collection('staffs').findOne({ id: model.id })

    const statusText = `${constants.Statuses.PendingBTT} => ${constants.Statuses.PendingDES}`

    const emailRes = await email.send(getStaffAfterUpdate, statusText, emails)

    if (emailRes === false) {
        return {
            ok: false,
            error: 'Request declined but could not send email notification'
        }
    }

    return {
        ok: true
    }
}

const insertStaffFromGpx = async (body, ctx) => {
    logger.info('New request from gpx received', { body })

    if (body.TypeOfFlight === 'End of season') {
        const resignationStaffs = await getResignationStaffByOriginalStaffId(body.Id)

        if (resignationStaffs && resignationStaffs.length > 0) {
            logger.info('Aborting new end of season request from gpx, resignation exists', { body, resignationStaffs })

            return {
                ok: true
            }
        }
    }

    let model = new constants.Staff()

    const destination = body.Destination ? body.Destination : ''
    const greenLightDestinations = config.greenLightDestinations.split(',')
    const greenLight =
        greenLightDestinations.includes(destination) && body.TypeOfFlight !== 'End of season' && body.TypeOfFlight !== 'Resignation' ? false : null

    const getStaff = await getNewOrPendingStaffByOriginalStaffIdAndDirection(body.Id, body.Direction)

    if (getStaff) {
        logger.info(
            `Request from GPX with status new or pending already exists, updating values and reverting status to: ${constants.Statuses.New}`,
            {
                url: ctx.url,
                body,
                getStaff
            }
        )

        model = getStaff

        const audit = {
            updatedBy: 'SYSTEM',
            greenLightFrom: getStaff.greenLight,
            greenLightTo: greenLight,
            statusFrom: getStaff.status !== constants.Statuses.New && getStaff.greenLight === false ? 'PendingHR' : getStaff.status,
            statusTo: constants.Statuses.New,
            group: null,
            date: new Date()
        }

        model.audit.push(audit)

        if (getStaff.status !== constants.Statuses.New) {
            const comment = {
                text: `Request change from TTP due to change in planned assignment start date and/or destination: ticket has been moved back to status ${
                    constants.Statuses.New
                }, please provide details and/or preferred flight date again`,
                id: uuid.v1(),
                created: moment()._d,
                createdBy: 'SYSTEM',
                group: ''
            }

            model.comments.push(comment)

            emails = new constants.EmailRecipients()

            //Add BS
            if (getStaff.requestedBy && getStaff.requestedBy.email) {
                emails.to.push(getStaff.requestedBy.email)
            }

            //Add BTT CC
            emails.to.push(config.emailBTTCC)

            if (emails.to.length > 0) {
                const statusText = `Pending => ${constants.Statuses.New}`

                const emailRes = await email.send(getStaff, statusText, emails)

                if (emailRes === true) {
                    logger.info('Sent pending => new notification', { emails, emailRes, getStaff })
                } else {
                    logger.warning('Could not send pending => new notification', { emailRes, getStaff })
                }
            }
        }
    } else {
        model.id = uuid.v1()
        model.created = moment()._d

        model.audit.push({
            updatedBy: 'TPP',
            greenLightFrom: greenLight,
            greenLightTo: greenLight,
            statusFrom: constants.Statuses.New,
            statusTo: constants.Statuses.New,
            group: null,
            date: new Date()
        })
    }

    if (body.DateOfBirth) {
        const dateOfBirth = moment(body.DateOfBirth)
        const dateOfBirthValid = dateOfBirth.isValid()

        if (dateOfBirthValid === true) {
            model.dateOfBirth = moment(body.DateOfBirth).format('DD/MM/YYYY')
        }
    }

    if (body.PositionStart) {
        const positionStart = moment(body.PositionStart)
        const positionStartValid = positionStart.isValid()

        if (positionStartValid === true) {
            model.plannedAssignmentStartDate = moment(body.PositionStart).format('DD/MM/YYYY')
        }
    }

    model.originalStaffId = body.Id
    model.direction = body.Direction
    model.firstName = body.FirstName ? body.FirstName : ''
    model.lastName2 = body.LastName2 ? body.LastName2 : ''
    model.lastName = body.LastName ? body.LastName : ''
    model.sourceMarket = body.SourceMarket ? body.SourceMarket : ''
    model.phone = body.Phone ? body.Phone : ''
    model.status = constants.Statuses.New
    model.gender = body.Gender ? body.Gender : ''
    model.destination = destination
    model.jobTitle = body.JobTitle ? body.JobTitle : ''
    model.iataCode = body.IataCode ? body.IataCode : ''
    model.greenLight = greenLight
    model.positionAssignId = body.PositionAssignId ? body.PositionAssignId : null
    model.typeOfFlight = body.TypeOfFlight ? body.TypeOfFlight : ''

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

    if (!getStaff) {
        const confirmedExists = await getConfirmedStaffByOriginalStaffIdAndDirection(body.Id, body.Direction)

        if (confirmedExists) {
            logger.info(`Request sent from GPX already exists with status: ${constants.Statuses.Confirmed}, allocating new request`, {
                url: ctx.url,
                body,
                getStaff
            })

            const comment = {
                text: `Request sent from GPX with id: ${model.originalStaffId} and direction: ${body.Direction} already exists with status: ${
                    constants.Statuses.Confirmed
                }, allocating new request.`,
                id: uuid.v1(),
                created: moment()._d,
                createdBy: 'SYSTEM',
                group: ''
            }

            model.comments.push(comment)
        }
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
        .find({}, { projection: { attachments: 0 } })
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
        .find({ greenLight: parseGreenLight, status: { $ne: constants.Statuses.New } }, { projection: { attachments: 0 } })
        .toArray()

    return staffs
}

const getStaffByIdAndGreenLight = async (id, greenLight) => {
    const parseGreenLight = greenLight === 'true'

    const staff = await mongo.collection('staffs').findOne({ id: id, greenLight: parseGreenLight }, { projection: { 'attachments.data': 0 } })

    return staff
}

const getStaffsByStatus = async status => {
    let staffs = []

    if (status === constants.Statuses.New) {
        staffs = await mongo
            .collection('staffs')
            .find({ status: status }, { projection: { attachments: 0 } })
            .toArray()
    } else {
        staffs = await mongo
            .collection('staffs')
            .find({ status: status, greenLight: { $ne: false } }, { projection: { attachments: 0 } })
            .toArray()
    }

    return staffs
}

const getStaffById = async id => {
    const staff = await mongo.collection('staffs').findOne({ id: id }, { projection: { 'attachments.data': 0 } })

    return staff
}

const getResignationStaffByOriginalStaffId = async originalStaffId => {
    const staffs = await mongo
        .collection('staffs')
        .find({ originalStaffId, typeOfFlight: 'Resignation' }, { projection: { attachments: 0 } })
        .toArray()

    return staffs
}

const getNewOrPendingStaffByOriginalStaffIdAndDirection = async (originalStaffId, direction) => {
    const staff = await mongo
        .collection('staffs')
        .findOne({ originalStaffId, direction, typeOfFlight: { $ne: 'Resignation' }, status: { $ne: constants.Statuses.Confirmed } })

    return staff
}

const getConfirmedStaffByOriginalStaffIdAndDirection = async (originalStaffId, direction) => {
    const staff = await mongo
        .collection('staffs')
        .findOne({ originalStaffId, direction, status: constants.Statuses.Confirmed, typeOfFlight: { $ne: 'Resignation' } })

    return staff
}

const getStaffByIdAndStatus = async (id, status) => {
    let staff = null

    if (status === constants.Statuses.New) {
        staff = await mongo.collection('staffs').findOne({ id: id, status: status }, { projection: { 'attachments.data': 0 } })
    } else {
        staff = await mongo
            .collection('staffs')
            .findOne({ id: id, status: status, greenLight: { $ne: false } }, { projection: { 'attachments.data': 0 } })
    }

    return staff
}

const updateOrInsertStaff = async (body, ctx) => {
    const user = await userService.getUser(ctx)

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

    const btt = user.roles.includes(constants.UserRoles.BTT)

    if (btt === true && model.status === constants.Statuses.Confirmed) {
        model.confirmedStatus = body.confirmedStatus
        model.dateOfConfirmation = moment().format('DD/MM/YYYY HH:mm')
    }

    let validation = null

    const getStaff = await mongo.collection('staffs').findOne({ id: model.id })

    if (btt) {
        //BTT
        model = Object.assign(model, new constants.StaffBTT())
        model.currency = body.currency

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
                confirmedFlightDate: flight.confirmedFlightDate,
                hotelNeededHotelName: flight.hotelNeededHotelName,
                hotelNeededHotelStart: flight.hotelNeededHotelStart,
                hotelNeededHotelEnd: flight.hotelNeededHotelEnd,
                bookingReference: flight.bookingReference,
                paymentMethod: flight.paymentMethod,
                luggage: flight.luggage,
                costCentre: flight.costCentre,
                travelType: flight.travelType,
                railFlyRequestedAndBooked: flight.railFlyRequestedAndBooked
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
        logger.warning('Staff model validation failed, aborting', { url: ctx.url, model, validation, user })

        return {
            ok: false,
            errors: validation.errors
        }
    }

    //Should not be overwritten from request
    if (btt === false && getStaff) {
        model.flights = getStaff.flights
        model.currency = getStaff.currency
    }

    model.attachments = getStaff && getStaff.attachments ? getStaff.attachments : []
    model.created = getStaff ? getStaff.created : null
    model.requestedBy = getStaff ? getStaff.requestedBy : null
    model.direction = getStaff ? getStaff.direction : null
    model.originalStaffId = getStaff ? getStaff.originalStaffId : null
    model.greenLightUpdated = getStaff ? getStaff.greenLightUpdated : null
    model.greenLightUpdatedBy = getStaff ? getStaff.greenLightUpdatedBy : null
    model.greenLightUpdatedByEmail = getStaff ? getStaff.greenLightUpdatedByEmail : null
    model.dateRequested = getStaff ? getStaff.dateRequested : null
    model.sentEmails = getStaff ? getStaff.sentEmails : []
    if (add === true && model.comment && model.comment !== '') {
        const comment = {
            text: model.comment,
            id: uuid.v1(),
            created: moment()._d,
            createdBy: user.name,
            group: user.roles.join(', ')
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
        model.dateOfConfirmation = getStaff ? getStaff.dateOfConfirmation : null
    }
    model.greenLight = getStaff ? getStaff.greenLight : null

    if (add === true) {
        return await insertStaff(ctx, model, getStaff, btt, user)
    } else {
        return await updateStaff(ctx, model, getStaff, btt, user)
    }
}

async function insertStaff(ctx, model, getStaff, btt, user) {
    if (btt === false) {
        model = Object.assign(model, new constants.StaffBTT())
    }

    if (getStaff) {
        logger.warning(`Staff with id: '${model.id}' already exists`, { url: ctx.url, model, user })

        return {
            ok: false,
            error: `Request with id: '${model.id}' already exists`
        }
    }
    model.dateRequested = moment()._d
    model.created = moment()._d
    model.requestedBy = {
        name: user.name,
        email: user.email
    }
    model.status = constants.Statuses.PendingBTT

    if (model.typeOfFlight === 'Start of season') {
        const greenLightDestinations = config.greenLightDestinations.split(',')
        model.greenLight = greenLightDestinations.includes(model.destination) ? false : null
    }

    model.audit.push({
        updatedBy: user.name,
        greenLightFrom: model.greenLight,
        greenLightTo: model.greenLight,
        statusFrom: constants.Statuses.New,
        statusTo: model.greenLight === false ? 'PendingHR' : model.status,
        group: user.roles.join(', '),
        date: new Date()
    })

    let insertOne = {}

    try {
        insertOne = (await mongo.collection('staffs').insertOne(model)).result
    } catch (err) {
        logger.error('Error inserting staff', err, { model, url: ctx.url, user })

        return {
            ok: false,
            error: 'Add request failed'
        }
    }

    logger.info('Insert staff result', { url: ctx.url, model, insertOne, user })

    if (insertOne.ok === false) {
        return {
            ok: false,
            error: 'Add request failed'
        }
    }

    return await sendInsertEmails(ctx, model, user)
}

async function sendInsertEmails(ctx, model, user) {
    //Add createdBy and BTT to emails (NEW => PENDINGBTT)
    const statusText = `${constants.Statuses.New} => ${model.greenLight === false ? 'PendingHR' : constants.Statuses.PendingBTT}`

    let emails = new constants.EmailRecipients()

    if (model.greenLight === false) {
        //Add HR
        emails = helpers.getHREmails(model.destination)

        emails.to.push(config.emailBTTCC)
    } else {
        //Get BTT to/cc based on sourceMarket
        emails = helpers.getBTTEmails(model.sourceMarket)
    }

    //Add BS
    if (model.requestedBy && model.requestedBy.email) {
        emails.to.push(model.requestedBy.email)
    }

    //Add additional emails
    if (model.emails && model.emails.length > 0) {
        emails.to.push(...model.emails)
    }

    const emailRes = await email.send(model, statusText, emails)

    if (emailRes === false) {
        return {
            ok: false,
            error: 'Request added but could not send email notification'
        }
    }

    logger.info('Insert staff successfull', { url: ctx.url, model, user })

    return {
        ok: true,
        greenLight: model.greenLight
    }
}

async function updateStaff(ctx, model, getStaff, btt, user) {
    if (btt === false && getStaff.status !== constants.Statuses.Confirmed && model.status === constants.Statuses.Confirmed) {
        logger.error('BS is trying to set request status to confirm', { url: ctx.url, getStaff, model, user })

        return {
            ok: false,
            error: 'Not allowed to set request status to confirm'
        }
    }

    model.audit.push({
        updatedBy: user.name,
        greenLightFrom: getStaff.greenLight,
        greenLightTo: getStaff.greenLight,
        statusFrom: getStaff.status,
        statusTo: getStaff.greenLight === false ? 'PendingHR' : model.status,
        group: user.roles.join(', '),
        date: new Date()
    })

    let replaceOne = {}

    if (getStaff.status === constants.Statuses.New && model.status === constants.Statuses.PendingBTT) {
        model.dateRequested = moment()._d
        model.requestedBy = {
            name: user.name,
            email: user.email
        }
    }

    try {
        replaceOne = (await mongo.collection('staffs').replaceOne({ id: model.id }, { $set: model })).result
    } catch (err) {
        logger.error('Error updating staff', err, { model, url: ctx.url, user })

        return {
            ok: false,
            error: 'Update request failed'
        }
    }

    logger.info('Update staff result', { url: ctx.url, model, replaceOne, user })

    if (replaceOne.ok === false) {
        return {
            ok: false,
            error: 'Update request failed'
        }
    }

    return await sendUpdateEmailsAndConfirm(ctx, model, getStaff, user)
}

async function sendUpdateEmailsAndConfirm(ctx, model, getStaff, user) {
    const statusText = `${getStaff.greenLight === false && getStaff.status !== constants.Statuses.New ? 'PendingHR' : getStaff.status} => ${
        getStaff.greenLight === false ? 'PendingHR' : model.status
    }`

    //Get BTT to/cc based on sourceMarket
    let emails = helpers.getBTTEmails(model.sourceMarket)

    //Send (NEW => PENDINGBTT)
    if (getStaff.status === constants.Statuses.New && model.status === constants.Statuses.PendingBTT) {
        if (model.greenLight === false) {
            //Add HR
            emails = helpers.getHREmails(model.destination)

            emails.to.push(config.emailBTTCC)
        } else {
            //Get BTT to/cc based on sourceMarket
            emails = helpers.getBTTEmails(model.sourceMarket)
        }

        //Add BS
        if (model.requestedBy && model.requestedBy.email) {
            emails.to.push(model.requestedBy.email)
        }

        //Add additional emails
        if (model.emails && model.emails.length > 0) {
            emails.to.push(...model.emails)
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
    //Send (PENDINGBTT => CONFIRMED) + Confirm
    else if (getStaff.status === constants.Statuses.PendingBTT && model.status === constants.Statuses.Confirmed) {
        //Send confirm date to GPX
        if (config.sendConfirmToGPX === true && model.originalStaffId && model.positionAssignId) {
            const confirmedDate = model.confirmedStatus === constants.ConfirmedStatuses.Cancelled ? null : model.flights[0].confirmedFlightDate

            const confirmRes = await gpxService.confirm(
                ctx,
                model.positionAssignId,
                confirmedDate,
                model.destination,
                model.originalStaffId,
                model.direction,
                user
            )

            if (confirmRes !== true) {
                return {
                    ok: false,
                    error: 'Request updated but could not send confirm to GPX or send email notifications'
                }
            }
        }

        //Add HR
        if (model.greenLight === true && model.greenLightUpdatedBy) {
            const confirmedHREmail = helpers.getConfirmedHREmail(model.destination, model.greenLightUpdatedBy)

            if (confirmedHREmail !== null) {
                emails.to.push(confirmedHREmail)
            }
        }

        //Add BS
        if (model.requestedBy && model.requestedBy.email) {
            emails.to.push(model.requestedBy.email)
        }

        //Add additional emails
        if (model.emails && model.emails.length > 0) {
            emails.to.push(...model.emails)
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
    //Send (PENDINGBTT => PENDINGDES)
    else if (getStaff.status === constants.Statuses.PendingBTT && model.status === constants.Statuses.PendingDES) {
        emails = helpers.getBTTCC()

        //Add BS
        if (model.requestedBy && model.requestedBy.email) {
            emails.to.push(model.requestedBy.email)
        }

        //Add additional emails
        if (model.emails && model.emails.length > 0) {
            emails.to.push(...model.emails)
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
    //Send (PENDINGDES => PENDINGBTT)
    else if (getStaff.status === constants.Statuses.PendingDES && model.status === constants.Statuses.PendingBTT) {
        //Add BS
        if (model.requestedBy && model.requestedBy.email) {
            emails.to.push(model.requestedBy.email)
        }

        //Add additional emails
        if (model.emails && model.emails.length > 0) {
            emails.to.push(...model.emails)
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
    //Send (CONFIRMED => PENDINGBTT)
    else if (getStaff.status === constants.Statuses.Confirmed && model.status === constants.Statuses.PendingBTT) {
        //Send empty confirm date to GPX
        if (config.sendConfirmToGPX === true && model.originalStaffId && model.positionAssignId) {
            const confirmedDate = null

            const confirmRes = await gpxService.confirm(
                ctx,
                model.positionAssignId,
                confirmedDate,
                model.destination,
                model.originalStaffId,
                model.direction,
                user
            )

            if (confirmRes !== true) {
                return {
                    ok: false,
                    error: 'Request updated but could not send confirm to GPX or send email notifications'
                }
            }
        }

        if (model.greenLight !== null) {
            //Add HR
            const hrEmails = helpers.getHREmails(model.destination).to

            emails.to.concat(hrEmails)
        }

        //Add BS
        if (model.requestedBy && model.requestedBy.email) {
            emails.to.push(model.requestedBy.email)
        }

        //Add additional emails
        if (model.emails && model.emails.length > 0) {
            emails.to.push(...model.emails)
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
    //Send (X => CONFIRMED) + Confirm
    else if (model.status === constants.Statuses.Confirmed) {
        //Send confirm date to GPX
        if (config.sendConfirmToGPX === true && model.originalStaffId && model.positionAssignId) {
            const confirmedDate = model.confirmedStatus === constants.ConfirmedStatuses.Cancelled ? null : model.flights[0].confirmedFlightDate

            const confirmRes = await gpxService.confirm(
                ctx,
                model.positionAssignId,
                confirmedDate,
                model.destination,
                model.originalStaffId,
                model.direction,
                user
            )

            if (confirmRes !== true) {
                return {
                    ok: false,
                    error: 'Request updated but could not send confirm to GPX or send email notifications'
                }
            }
        }

        //Add HR
        if (model.greenLight === true && model.greenLightUpdatedBy) {
            const confirmedHREmail = helpers.getConfirmedHREmail(model.destination, model.greenLightUpdatedBy)

            if (confirmedHREmail !== null) {
                emails.to.push(confirmedHREmail)
            }
        }

        //Add BS
        if (model.requestedBy && model.requestedBy.email) {
            emails.to.push(model.requestedBy.email)
        }

        //Add additional emails
        if (model.emails && model.emails.length > 0) {
            emails.to.push(...model.emails)
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

    logger.info('Update staff successfull', { url: ctx.url, model, user })

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
    confirmGreenLight,
    getNewOrPendingStaffByOriginalStaffIdAndDirection,
    getConfirmedStaffByOriginalStaffIdAndDirection,
    deleteStaff,
    resign,
    deleteStaffByPositionAssignId
}
