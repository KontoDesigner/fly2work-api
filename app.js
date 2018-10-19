const Koa = require('koa')
const logger = require('tuin-logging')
const camelcaseKeys = require('camelcase-keys')
const routes = require('./routes')
const bodyParser = require('koa-bodyparser')
const requestId = require('koa-requestid')
const mongo = require('./mongo')
const cors = require('@koa/cors')
require('dotenv').config()

async function errorHandler(ctx, next) {
    try {
        await next()
    } catch (err) {
        logger.error(err.message, err)

        ctx.status = err.status || 500

        ctx.body = {
            error: err.message
        }
    }
}

async function camelCase(ctx, next) {
    if (ctx.body && ctx.response.type === 'application/json') {
        ctx.body = camelcaseKeys(ctx.body, { deep: true })
    }

    await next()
}

async function logIncomingRequest(ctx, next) {
    const start = Date.now()

    return next().then(() => {
        const ms = Date.now() - start

        logger.info(`INCOMING ${ctx.method}`, { url: ctx.url, ms })
    })
}

async function main() {
    mongo.connect()

    const app = new Koa()
    app.use(bodyParser())
    app.use(requestId())
    app.use(cors())
    app.use(errorHandler)
    app.use(logIncomingRequest)
    app.use(camelCase)
    app.use(routes)

    module.exports = app
}

return main().catch(err => console.log(err.stack))
