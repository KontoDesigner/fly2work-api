const logger = require('tuin-logging')
const pdfMakePrinter = require('pdfmake/src/printer')

function generatePdf(staff, callback) {
    const docDefinition = {
        content: ['This will show up in the file created']
    }

    try {
        // const fontDescriptors = {}
        // const printer = new pdfMakePrinter(fontDescriptors)
        // const doc = printer.createPdfKitDocument(docDefinition)

        const doc = new pdfMakePrinter({
            Roboto: { normal: new Buffer(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Regular.ttf'], 'base64') }
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

module.exports = {
    generatePdf
}
