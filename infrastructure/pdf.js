const logger = require('tuin-logging')
const pdfMakePrinter = require('pdfmake/src/printer')
const moment = require('moment')

function generatePdfCallback(staff, callback) {
    logger.info('Started pdf export', { staff })

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
    const comments = staff.comments
        ? staff.comments.map(c => [
              { text: c.text ? c.text : ' ' },
              { text: c.createdBy ? c.createdBy : ' ' },
              { text: c.group ? c.group : ' ' },
              { text: c.created ? moment(c.created).format('YYYY-MM-DD') : ' ' }
          ])
        : []

    const commentBody = [
        [{ text: 'Text', bold: true }, { text: 'Created By', bold: true }, { text: 'Group', bold: true }, { text: 'Created', bold: true }]
    ]

    commentBody.push(...comments)

    return {
        content: [
            {
                text: `${staff.firstName} ${staff.lastName} (${staff.status === null ? 'New' : staff.status})`,
                style: 'header',
                alignment: 'center',
                bold: true,
                fontSize: 20,
                margin: [0, 0, 0, 5]
            },
            {
                text: `${staff.sourceMarket}, ${staff.destination}`,
                style: 'header',
                alignment: 'center',
                bold: true,
                fontSize: 14,
                margin: [0, 0, 0, 8]
            },
            {
                margin: [0, 0, 0, 5],
                table: {
                    headerRows: 0,
                    widths: ['*', '*', '*'],
                    body: [
                        [
                            { text: 'Date Of Birth', bold: true },
                            { text: 'Planned Assignment Start Date', bold: true },
                            { text: 'Date Of Flight', bold: true }
                        ],
                        [
                            { text: staff.dateOfBirth ? moment(staff.dateOfBirth).format('DD/MM/YYYY') : ' ' },
                            { text: staff.positionStart ? moment(staff.positionStart).format('YYYY-MM-DD') : ' ' },
                            { text: staff.dateOfFlight ? moment(staff.dateOfFlight).format('YYYY-MM-DD') : ' ' }
                        ],

                        [{ text: 'Job Title', bold: true }, { text: 'Phone', bold: true }, { text: 'Departure Airport', bold: true }],
                        [
                            { text: staff.jobTitle ? staff.jobTitle : ' ' },
                            { text: staff.phone ? staff.phone : ' ' },
                            { text: staff.departureAirport ? staff.departureAirport : ' ' }
                        ],

                        [{ text: 'Arrival Airport', bold: true }, { text: 'Type Of Flight', bold: true }, { text: 'Gender', bold: true }],
                        [
                            { text: staff.arrivalAirport ? staff.arrivalAirport : ' ' },
                            { text: staff.typeOfFlight ? staff.typeOfFlight : ' ' },
                            { text: staff.gender ? (staff.gender === 'M' ? 'MALE' : 'FEMALE') : ' ' }
                        ],

                        [{ text: 'Hotel Needed', bold: true }, { text: 'Hotel Start', bold: true }, { text: 'Hotel End', bold: true }],
                        [
                            { text: staff.hotelNeeded === true ? 'YES' : 'NO' },
                            { text: staff.hotelNeededHotelStart ? moment(staff.hotelNeededHotelStart).format('YYYY-MM-DD') : ' ' },
                            { text: staff.hotelNeededHotelEnd ? moment(staff.hotelNeededHotelEnd).format('YYYY-MM-DD') : ' ' }
                        ],

                        [
                            { text: 'Book Return Flight', bold: true },
                            { text: 'Date Of Flight (BRF)', bold: true },
                            { text: 'Departure Airport (BRF)', bold: true }
                        ],
                        [
                            { text: staff.bookReturnFlight === true ? 'YES' : 'NO' },
                            { text: staff.bookReturnFlightDateOfFlight ? moment(staff.bookReturnFlightDateOfFlight).format('YYYY-MM-DD') : ' ' },
                            { text: staff.bookReturnFlightDepartureAirport ? staff.bookReturnFlightDepartureAirport : ' ' }
                        ],

                        [{ text: 'Arrival Airport (BRF)', bold: true }, { text: 'Rail & Fly', bold: true }, { text: 'Iata Code', bold: true }],
                        [
                            { text: staff.bookReturnFlightArrivalAirport ? staff.bookReturnFlightArrivalAirport : ' ' },
                            { text: staff.railFly === true ? 'YES' : 'NO' },
                            { text: staff.iataCode ? staff.iataCode : ' ' }
                        ],
                        [{ text: 'Passport Number', bold: true }, { text: ' ', bold: true }, { text: ' ', bold: true }],
                        [{ text: staff.passportNumber ? staff.passportNumber : ' ' }, { text: ' ' }, { text: ' ' }]
                    ]
                },

                layout: {
                    fillColor: function(i, node) {
                        return i % 2 === 0 ? '#CCCCCC' : null
                    },
                    paddingTop: function(i, node) {
                        return 5
                    },
                    paddingBottom: function(i, node) {
                        return 5
                    }
                },
                alignment: 'center'
            },
            {
                text: 'BTT',
                style: 'header',
                alignment: 'center',
                bold: true,
                fontSize: 14,
                margin: [0, 0, 0, 5]
            },
            {
                table: {
                    headerRows: 0,
                    widths: ['*', '*', '*'],

                    body: [
                        [{ text: 'Flight Number', bold: true }, { text: 'Booking Reference', bold: true }, { text: 'Cost Centre', bold: true }],
                        [
                            { text: staff.flightNumber ? staff.flightNumber : ' ' },
                            { text: staff.bookingReference ? staff.bookingReference : ' ' },
                            { text: staff.costCentre ? staff.costCentre : ' ' }
                        ],

                        [{ text: 'Payment Method', bold: true }, { text: 'Xbag', bold: true }, { text: 'Flight Cost', bold: true }],
                        [
                            { text: staff.paymentMethod ? staff.paymentMethod : ' ' },
                            { text: staff.xbag ? staff.xbag : ' ' },
                            { text: staff.flightCost ? staff.flightCost : ' ' }
                        ],

                        [{ text: 'Xbag cost', bold: true }, { text: 'Hotel Cost', bold: true }, { text: 'Total Cost', bold: true }],
                        [
                            { text: staff.xbagCost ? staff.xbagCost : ' ' },
                            { text: staff.hotelCost ? staff.hotelCost : ' ' },
                            { text: staff.totalCost ? staff.totalCost : ' ' }
                        ],

                        [{ text: 'Flight Departure Time', bold: true }, { text: 'Flight Arrival Time', bold: true }, { text: ' ', bold: true }],
                        [
                            { text: staff.flightDepartureTime ? moment(staff.flightDepartureTime).format('YYYY-MM-DD') : ' ' },
                            { text: staff.flightArrivalTime ? moment(staff.flightArrivalTime).format('YYYY-MM-DD') : ' ' },
                            { text: ' ' }
                        ]
                    ]
                },

                layout: {
                    fillColor: function(i, node) {
                        return i % 2 === 0 ? '#CCCCCC' : null
                    },
                    paddingTop: function(i, node) {
                        return 5
                    },
                    paddingBottom: function(i, node) {
                        return 5
                    }
                },
                alignment: 'center'
            },
            {
                text: 'Comments',
                style: 'header',
                alignment: 'center',
                bold: true,
                fontSize: 14,
                margin: [0, 4, 0, 5]
            },
            {
                table: {
                    headerRows: 0,
                    widths: ['*', '*', '*', '*'],

                    body: commentBody
                },

                layout: {
                    fillColor: function(i, node) {
                        return i % 2 === 0 ? '#CCCCCC' : null
                    },
                    paddingTop: function(i, node) {
                        return 5
                    },
                    paddingBottom: function(i, node) {
                        return 5
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
