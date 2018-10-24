const router = require('koa-better-router')().loadMethods()
const mongo = require('../mongo')
const logger = require('tuin-logging')
const constants = require('../constants')

const BASE = '/staff'

router.get(BASE, async (ctx, next) => {
    const staffs = await mongo
        .collection('staffs')
        .find({ status: ctx.params.status })
        .toArray()

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, staffs })

    ctx.body = {
        staffs: staffs
    }

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
    const overview = res.find(obj => obj._id === constants.Statuses.Overview)

    const count = {
        new: _new ? _new.count : 0,
        submitted: submitted ? submitted.count : 0,
        pending: pending ? pending.count : 0,
        confirmed: confirmed ? confirmed.count : 0,
        overview: overview ? overview.count : 0
    }

    logger.info(`OUTGOING ${ctx.method}`, { url: ctx.url, count })

    ctx.body = count

    await next()
})

router.get(`${BASE}/:status`, async (ctx, next) => {
    const staffs = await mongo
        .collection('staffs')
        .find({ status: ctx.params.status })
        .toArray()

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
