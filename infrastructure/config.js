require('dotenv').config()

const config = {
    mongo: process.env.MONGO,
    gpx: process.env.GPX
}

module.exports = config
