require('dotenv').config()

const config = {
    mongoConnectionString: process.env.MONGO_CONNECTIONSTRING,
    gpxApi: process.env.GPX_API,
    mailApi: process.env.MAIL_API,
    name: process.env.NAME,
    emailBTT: process.env.EMAIL_BTT,
    emailUserAddress: process.env.EMAIL_USER_ADDRESS,
    authAuthority: process.env.AUTH_AUTHORITY,
    authClientId: process.env.AUTH_CLIENTID,
    authTenantId: process.env.AUTH_TENANTID
}

module.exports = config
