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

    emailBTTN: process.env.EMAIL_BTT_N,
    emailBTTNCC: process.env.EMAIL_BTT_N_CC,

    emailBTTW: process.env.EMAIL_BTT_W,
    emailBTTWCC: process.env.EMAIL_BTT_W_CC,

    emailBTTE: process.env.EMAIL_BTT_E,
    emailBTTECC: process.env.EMAIL_BTT_E_CC,

    emailNSourceMarkets: process.env.EMAIL_N_SOURCEMARKETS,
    emailWSourceMarkets: process.env.EMAIL_W_SOURCEMARKETS,
    emailESourceMarkets: process.env.EMAIL_E_SOURCEMARKETS,

    authAuthority: process.env.AUTH_AUTHORITY,
    authClientId: process.env.AUTH_CLIENTID,
    authTenantId: process.env.AUTH_TENANTID
}

module.exports = config
