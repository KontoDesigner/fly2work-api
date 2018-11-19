const logger = require('tuin-logging')
const mongo = require('mongodb')
const config = require('./config')
const MongoClient = mongo.MongoClient

let client = null
let db = null

const connect = async () => {
    const connection = config.mongoConnectionString

    logger.info('will now try and connect to mongo', { connection })

    try {
        client = await MongoClient.connect(
            connection,
            { useNewUrlParser: true }
        )

        db = client.db('ctx')

        logger.info('successfully connected to mongo')
    } catch (err) {
        logger.error('Could not connect to mongo', err, { connection })

        throw { ...err, message: `Error when connection to mongo`, innerMessage: err.message }
    }
}

const disconnect = async () => {
    return client.disconnect()
}

module.exports = {
    connect,
    disconnect,
    collection: collection => db.collection(collection)
}
