const Koa = require('koa')
const logger = require('tuin-logging')
const camelcaseKeys = require('camelcase-keys')
const routes = require('./routes')
const bodyParser = require('koa-bodyparser')
const requestId = require('koa-requestid')
const mongo = require('./infrastructure/mongo')
const cors = require('@koa/cors')
const config = require('./infrastructure/config')
const passport = require('koa-passport')
const BearerStrategy = require('passport-azure-ad').BearerStrategy

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
        if (ctx.url !== '/health') {
            const ms = Date.now() - start

            logger.info(`INCOMING ${ctx.method}`, { url: ctx.url, ms })
        }
    })
}

async function auth(ctx, next) {
    if (ctx.method === 'OPTIONS' || ctx.path.startsWith('/health') || ctx.url === '/') {
        await next()

        return
    }

    await passport.authenticate('oauth-bearer', { session: false })

    const isAuthenticated = await ctx.isAuthenticated()

    if (!isAuthenticated) {
        logger.info(`UNAUTHORIZED ${ctx.method}`, { url: ctx.url })

        ctx.throw(401)
    }

    if (ctx.path.startsWith('/staff/new')) {
        //request from GPX, no role required(?)
        await next()

        return
    }

    // const user = ctx.state.user
    const inRole = true

    if (!inRole) {
        logger.info(`PERMISSION DENIED ${ctx.method}`, { url: ctx.url })

        ctx.throw(403)
    }

    await next()
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
        logger.info(token, 'was the token retrieved')

        if (!token.oid) {
            done(new Error('oid is not found in token'))
        } else {
            owner = token.oid

            done(null, token)
        }
    })
    passport.use(bearerStrategy)
    app.use(auth)

    app.use(errorHandler)
    app.use(logIncomingRequest)
    app.use(camelCase)
    app.use(routes)

    module.exports = app
}

return main().catch(err => console.log(err.stack))
