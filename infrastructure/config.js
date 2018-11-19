require('dotenv').config()

const config = {
    mongoConnectionString: process.env.MONGO_CONNECTIONSTRING,
    gpxApi: process.env.GPX_API,
    mailApi: process.env.MAIL_API,
    name: process.env.NAME,
    emailTo: process.env.EMAIL_TO,
    emailUserAddress: process.env.EMAIL_USER_ADDRESS
}

module.exports = config
