require('dotenv').config()

const config = {
    mongo: process.env.MONGO,
    gpx: process.env.GPX,
    mailApi: process.env.MAIL_API,
    name: process.env.NAME,
    emailTo: process.env.EMAIL_TO,
    userAddress: process.env.USER_ADDRESS
}

module.exports = config
