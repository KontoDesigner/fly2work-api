const logger = require('tuin-logging')

function generateExcel(staff) {
    return new Promise((resolve, reject) => {
        try {
        } catch (err) {
            logger.error('Error generating excel', err, { staff })

            reject(new Error('Error generating excel'))

            throw err
        }
    })
}

module.exports = {
    generateExcel
}
