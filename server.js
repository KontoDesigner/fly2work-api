const app = require('./app')
const logger = require('./infrastructure/logger')

const port = process.env.SERVICE_PORT || 5000

app.listen(port, () => {
    logger.info('Koa server listening on port ' + port)
})
