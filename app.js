const Koa = require('koa')
const logger = require('./infrastructure/logger')
const camelcaseKeys = require('camelcase-keys')
const routes = require('./routes')
const bodyParser = require('koa-bodyparser')
const requestId = require('koa-requestid')
const mongo = require('./infrastructure/mongo')
const cors = require('@koa/cors')
const config = require('./infrastructure/config')
const passport = require('koa-passport')
const BearerStrategy = require('passport-azure-ad').BearerStrategy
const userService = require('./services/userService')

const authOptions = {
    identityMetadata: config.authAuthority + config.authTenantId + '/.well-known/openid-configuration',
    clientID: config.authClientId,
    validateIssuer: true,
    issuer: 'https://sts.windows.net/' + config.authTenantId + '/',
    passReqToCallback: false,
    isB2C: undefined,
    policyName: undefined,
    allowMultiAudiencesInToken: true,
    audience: config.authClientId,
    loggingLevel: 'warn'
}

async function errorHandler(ctx, next) {
    try {
        await next()
    } catch (err) {
        let user = null
        let body = null
        let url = null
        let params = null

        try {
            user = await userService.getUser(ctx)
            body = ctx.request.body
            url = ctx.url
            params = ctx.params
        } catch (e) {
            logger.error(err.message, err)
        } finally {
            logger.error(err.message, err, { user, body, url, params })

            ctx.status = err.status || 500

            ctx.body = {
                error: err.message
            }
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

    return await next().then(() => {
        if (ctx.url !== '/health') {
            const ms = Date.now() - start

            logger.info(`INCOMING ${ctx.method}`, { url: ctx.url, ms })
        }
    })
}

async function main() {
    mongo.connect()

    const app = new Koa()
    app.use(bodyParser())
    app.use(requestId())
    app.use(cors())

    app.use(passport.initialize())
    app.use(passport.session())
    const bearerStrategy = new BearerStrategy(authOptions, function(token, done) {
        if (!token.oid) {
            done(new Error('oid was not found in token'))
        } else {
            owner = token.oid

            done(null, token)
        }
    })
    passport.use(bearerStrategy)

    app.use(errorHandler)
    app.use(logIncomingRequest)
    app.use(camelCase)
    app.use(routes)

    module.exports = app
}

return main().catch(err => console.log(err.stack))
