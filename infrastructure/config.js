require('dotenv').config()

const config = {
    mongoConnectionString: process.env.MONGO_CONNECTIONSTRING,
    mongoName: process.env.MONGO_NAME,
    gpxApi: process.env.GPX_API,
    mailApi: process.env.MAIL_API,
    name: process.env.NAME,
    emailUserAddress: process.env.EMAIL_USER_ADDRESS,
    web: process.env.WEB,
    greenLightDestinations: process.env.GREENLIGHT_DESTINATIONS,
    maintenance: process.env.MAINTENANCE == 'true',
    timezone: process.env.TIMEZONE,
    sendConfirmToGPX: process.env.SEND_CONFIRM_TO_GPX == 'true',
    scope: process.env.SCOPE.toUpperCase(),

    emailBTTN: process.env.EMAIL_BTT_N,
    emailBTTW: process.env.EMAIL_BTT_W,
    emailBTTE: process.env.EMAIL_BTT_E,
    emailBTTUK: process.env.EMAIL_BTT_UK,
    emailBTTCC: process.env.EMAIL_BTT_CC,

    emailUKSourceMarkets: process.env.EMAIL_UK_SOURCEMARKETS,
    emailNSourceMarkets: process.env.EMAIL_N_SOURCEMARKETS,
    emailWSourceMarkets: process.env.EMAIL_W_SOURCEMARKETS,
    emailESourceMarkets: process.env.EMAIL_E_SOURCEMARKETS,

    emailHRTSAG: process.env.EMAIL_HR_TSAG,
    emailHRTSAGDestinations: process.env.EMAIL_HR_TSAG_DESTINATIONS,
    emailHRTDS: process.env.EMAIL_HR_TDS,
    emailHRTDSDestinations: process.env.EMAIL_HR_TDS_DESTINATIONS,

    authAuthority: process.env.AUTH_AUTHORITY,
    authClientId: process.env.AUTH_CLIENTID,
    authTenantId: process.env.AUTH_TENANTID,

    basicAuthUser: process.env.BASIC_AUTH_USER,
    basicAuthPassword: process.env.BASIC_AUTH_PASSWORD
}

module.exports = config
