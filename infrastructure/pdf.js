const logger = require('tuin-logging')
const pdfMakePrinter = require('pdfmake/src/printer')
const moment = require('moment')

function generatePdfCallback(staff, callback) {
    const docDefinition = getDocDefinition(staff)

    try {
        const doc = new pdfMakePrinter({
            Roboto: {
                normal: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
                bold: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Medium.ttf'], 'base64')
            }
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
        const docDefinition = getDocDefinition(staff)

        try {
            const doc = new pdfMakePrinter({
                Roboto: {
                    normal: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
                    bold: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Medium.ttf'], 'base64')
                }
            }).createPdfKitDocument(docDefinition)

            let chunks = []

            doc.on('data', chunk => {
                chunks.push(chunk)
            })

            doc.on('end', () => {
                const result = Buffer.concat(chunks)

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

function getDocDefinition(staff) {
    return {
        content: [
            {
                text: `${staff.id} (${staff.status === null ? 'New' : staff.status})\n\n`,
                style: 'header',
                alignment: 'center',
                bold: true,
                fontSize: 20
            },
            {
                table: {
                    headerRows: 0,
                    widths: ['*', '*', '*'],

                    body: [
                        [{ text: 'Name', bold: true }, { text: 'Date Of Birth', bold: true }, { text: 'Source Market', bold: true }],
                        [
                            { text: staff.name ? staff.name : ' ' },
                            { text: staff.dateOfBirth ? moment(staff.dateOfBirth).format('YYYY/MM/DD HH:mm') : ' ' },
                            { text: staff.sourceMarket ? staff.sourceMarket : ' ' }
                        ],

                        [{ text: 'Position Start', bold: true }, { text: 'Date Of Flight', bold: true }, { text: 'Hotel Needed', bold: true }],
                        [
                            { text: staff.positionStart ? moment(staff.positionStart).format('YYYY/MM/DD HH:mm') : ' ' },
                            { text: staff.dateOfFlight ? moment(staff.dateOfFlight).format('YYYY/MM/DD HH:mm') : ' ' },
                            {
                                text: staff.hotelNeeded ? (staff.hotelNeeded === true ? 'YES' : 'NO') : ' ',
                                fillColor: staff.hotelNeeded ? (staff.hotelNeeded === true ? '#eeffee' : '#f2cfcf') : ' '
                            }
                        ],

                        [{ text: 'Hotel Start', bold: true }, { text: 'Hotel End', bold: true }, { text: 'Role', bold: true }],
                        [
                            { text: staff.hotelStart ? moment(staff.hotelStart).format('YYYY/MM/DD HH:mm') : '-' },
                            { text: staff.hotelEnd ? moment(staff.hotelEnd).format('YYYY/MM/DD HH:mm') : '-' },
                            { text: staff.role ? staff.role : ' ' }
                        ],

                        [{ text: 'Destination', bold: true }, { text: 'Gender', bold: true }, { text: 'Phone', bold: true }],
                        [
                            { text: staff.destination ? staff.destination : ' ' },
                            { text: staff.gender ? staff.gender : ' ' },
                            { text: staff.phone ? staff.phone : ' ' }
                        ],

                        [{ text: 'Departure Airport', bold: true }, { text: 'Arrival Airport', bold: true }, { text: 'Type Of Flight', bold: true }],
                        [
                            { text: staff.departureAirport ? staff.departureAirport : ' ' },
                            { text: staff.arrivalAirport ? staff.arrivalAirport : ' ' },
                            { text: staff.typeOfFlight ? staff.typeOfFlight : ' ' }
                        ],
                        [{ text: 'Comment', bold: true, colSpan: 3 }],
                        [{ text: staff.comment ? staff.comment : ' ', colSpan: 3 }]
                    ]
                },
                layout: {
                    fillColor: function(i, node) {
                        return i % 2 === 0 ? '#CCCCCC' : null
                    },
                    paddingTop: function(i, node) {
                        return 10
                    },
                    paddingBottom: function(i, node) {
                        return 10
                    }
                },
                alignment: 'center'
            }
        ]
    }
}

module.exports = {
    generatePdfCallback,
    generatePdfPromise
}
