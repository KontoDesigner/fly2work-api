const logger = require('tuin-logging')
const pdfMakePrinter = require('pdfmake/src/printer')

function generatePdfCallback(staff, callback) {
    const docDefinition = {
        content: ['This will show up in the file created']
    }

    try {
        // const fontDescriptors = {}
        // const printer = new pdfMakePrinter(fontDescriptors)
        // const doc = printer.createPdfKitDocument(docDefinition)

        const doc = new pdfMakePrinter({
            Roboto: { normal: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Regular.ttf'], 'base64') }
        }).createPdfKitDocument(docDefinition)

        let chunks = []

        doc.on('data', chunk => {
            chunks.push(chunk)
        })

        doc.on('end', () => {
            const result = Buffer.concat(chunks)

            callback('data:application/pdf;base64,' + result.toString('base64'))
        })

        doc.end()
    } catch (err) {
        logger.error('Error generating pdf', err, { staff })

        throw err
    }
}

function generatePdfPromise(staff) {
    return new Promise((resolve, reject) => {
        const docDefinition = {
            content: ['This will show up in the file created']
        }

        try {
            // const fontDescriptors = {}
            // const printer = new pdfMakePrinter(fontDescriptors)
            // const doc = printer.createPdfKitDocument(docDefinition)

            const doc = new pdfMakePrinter({
                Roboto: { normal: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Regular.ttf'], 'base64') }
            }).createPdfKitDocument(docDefinition)

            let chunks = []

            doc.on('data', chunk => {
                chunks.push(chunk)
            })

            doc.on('end', () => {
                const result = Buffer.concat(chunks)

                // callback('data:application/pdf;base64,' + result.toString('base64'))

                resolve(result)
            })

            doc.end()
        } catch (err) {
            logger.error('Error generating pdf', err, { staff })

            reject(new Error('Error generating pdf'))

            throw err
        }
    })
}

module.exports = {
    generatePdfCallback,
    generatePdfPromise
}
