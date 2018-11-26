const logger = require('tuin-logging')
const pdfMakePrinter = require('pdfmake/src/printer')
const moment = require('moment')
const constants = require('../infrastructure/constants')

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

            logger.info('Pdf export successfull', { staff, pdf: result })

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

                logger.info('Pdf export successfull', { staff, pdf: result })

                resolve(result)
            })

            doc.end()
        } catch (err) {
            logger.error('Error generating pdf', err, { staff })

            reject(new Error('Error generating pdf'))
        }
    })
}

function getDocDefinition(staff) {
    if (!staff) {
        return null
    }

    //Comments
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

    //Flights
    const flights = staff.flights
        ? staff.flights.map(f => [
              { text: f.flightNumber ? f.flightNumber : ' ' },
              { text: f.flightDepartureTime ? moment(f.flightDepartureTime).format('YYYY-MM-DD') : ' ' },
              { text: f.flightArrivalTime ? moment(f.flightArrivalTime).format('YYYY-MM-DD') : ' ' },
              { text: f.departureAirport ? f.departureAirport : ' ' },
              { text: f.arrivalAirport ? f.arrivalAirport : ' ' },
              { text: f.flightCost ? f.flightCost : ' ' },
              { text: f.xbagCost ? f.xbagCost : ' ' },
              { text: f.hotelCost ? f.hotelCost : ' ' },
              { text: parseCost(f.flightCost) + parseCost(f.xbagCost) + parseCost(f.hotelCost) }
          ])
        : []

    const flightBody = [
        [
            { text: 'Flight Number', bold: true },
            { text: 'Flight Departure Time', bold: true },
            { text: 'Flight Arrival Time', bold: true },
            { text: 'Departure Airport', bold: true },
            { text: 'Arrival Airport', bold: true },
            { text: 'Flight Cost', bold: true },
            { text: 'Xbag Cost', bold: true },
            { text: 'Hotel Cost', bold: true },
            { text: 'Total Cost', bold: true }
        ]
    ]

    flightBody.push(...flights)

    //Render
    return {
        content: [
            {
                text: `${staff.firstName} ${staff.lastName} ${staff.lastName2 ? staff.lastName2 + ' ' : ''}(${
                    staff.greenLight === false && staff.status !== constants.Statuses.New ? `Waiting For Approval (${staff.status})` : staff.status
                })`,
                style: 'header',
                alignment: 'center',
                bold: true,
                fontSize: 16,
                margin: [0, 0, 0, 5]
            },
            {
                text: `${staff.sourceMarket}, ${staff.destination}`,
                style: 'header',
                alignment: 'center',
                bold: true,
                fontSize: 12,
                margin: [0, 0, 0, 8]
            },
            {
                margin: [0, 0, 0, 5],
                fontSize: 9,
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

                        [{ text: 'Job Title', bold: true }, { text: 'Phone', bold: true }, { text: 'Departure Airports', bold: true }],
                        [
                            { text: staff.jobTitle ? staff.jobTitle : ' ' },
                            { text: staff.phone ? staff.phone : ' ' },
                            { text: staff.departureAirports ? staff.departureAirports : ' ' }
                        ],

                        [{ text: 'Arrival Airports', bold: true }, { text: 'Type Of Flight', bold: true }, { text: 'Gender', bold: true }],
                        [
                            { text: staff.arrivalAirports ? staff.arrivalAirports : ' ' },
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
                        return 2
                    },
                    paddingBottom: function(i, node) {
                        return 2
                    }
                },
                alignment: 'center'
            },
            {
                text: 'BTT',
                style: 'header',
                alignment: 'center',
                bold: true,
                fontSize: 12,
                margin: [0, 0, 0, 5]
            },
            {
                fontSize: 9,
                table: {
                    headerRows: 0,
                    widths: ['*', '*', '*'],
                    body: [
                        [{ text: 'Booking Reference', bold: true }, { text: 'Travel Type', bold: true }, { text: 'Payment Method', bold: true }],
                        [
                            { text: staff.bookingReference ? staff.bookingReference : ' ' },
                            { text: staff.travelType ? staff.travelType : ' ' },
                            { text: staff.paymentMethod ? staff.paymentMethod : ' ' }
                        ],

                        [{ text: 'Xbag', bold: true }, { text: 'Cost Centre', bold: true }, { text: 'Green Light', bold: true }],
                        [
                            { text: staff.xbag ? staff.xbag : ' ' },
                            { text: staff.costCentre ? staff.costCentre : ' ' },
                            { text: staff.greenLight !== undefined && staff.greenLight !== null ? (staff.greenLight == true ? 'YES' : 'NO') : '' }
                        ]
                    ]
                },

                layout: {
                    fillColor: function(i, node) {
                        return i % 2 === 0 ? '#CCCCCC' : null
                    },
                    paddingTop: function(i, node) {
                        return 2
                    },
                    paddingBottom: function(i, node) {
                        return 2
                    }
                },
                alignment: 'center'
            },
            {
                text: 'Flights',
                style: 'header',
                alignment: 'center',
                bold: true,
                fontSize: 12,
                margin: [0, 4, 0, 5]
            },
            {
                fontSize: 9,
                table: {
                    headerRows: 0,
                    widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*'],
                    body: flightBody
                },

                layout: {
                    fillColor: function(i, node) {
                        return i % 2 === 0 ? '#CCCCCC' : null
                    },
                    paddingTop: function(i, node) {
                        return 2
                    },
                    paddingBottom: function(i, node) {
                        return 2
                    }
                },
                alignment: 'center'
            },
            {
                text: 'Comments',
                style: 'header',
                alignment: 'center',
                bold: true,
                fontSize: 12,
                margin: [0, 4, 0, 5]
            },
            {
                fontSize: 9,
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
                        return 2
                    },
                    paddingBottom: function(i, node) {
                        return 2
                    }
                },
                alignment: 'center'
            }
        ]
    }
}

function parseCost(val) {
    var parsed = parseInt(val)

    if (isNaN(parsed)) {
        return 0
    }

    return parsed
}

module.exports = {
    generatePdfCallback,
    generatePdfPromise
}
