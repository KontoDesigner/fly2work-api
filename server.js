const app = require('./app')

const port = process.env.SERVICE_PORT || 5000

app.listen(port, () => {
    console.log('Express server listening on port ' + port)
})
