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

function getFlights(staff) {
    const flightBodies = staff.flights
        ? staff.flights.map(flight => [
              [
                  { text: 'Flight Number', bold: true, style: 'header' },
                  { text: flight.flightNumber ? flight.flightNumber.toUpperCase() : ' ', style: 'cell' },
                  { text: 'Flight Departure Time', bold: true, style: 'header' },
                  {
                      text: flight.flightDepartureTime ? flight.flightDepartureTime : ' ',
                      style: 'cell'
                  },
                  { text: 'Flight Arrival Time', bold: true, style: 'header' },
                  {
                      text: flight.flightArrivalTime ? flight.flightArrivalTime : ' ',
                      style: 'cell'
                  }
              ],
              [
                  { text: 'Departure Airport', bold: true, style: 'header' },
                  { text: flight.departureAirport ? flight.departureAirport.toUpperCase() : ' ', style: 'cell' },
                  { text: 'Arrival Airport', bold: true, style: 'header' },
                  { text: flight.arrivalAirport ? flight.arrivalAirport.toUpperCase() : ' ', style: 'cell' },
                  { text: 'Flight Cost', bold: true, style: 'header' },
                  { text: flight.flightCost ? flight.flightCost : ' ', style: 'cell' }
              ],
              [
                  { text: 'Xbag Cost', bold: true, style: 'header' },
                  { text: flight.xbagCost ? flight.xbagCost : ' ', style: 'cell' },
                  { text: 'Hotel Cost', bold: true, style: 'header' },
                  { text: flight.hotelCost ? flight.hotelCost : ' ', style: 'cell' },
                  { text: 'Total Cost', bold: true, style: 'header' },
                  {
                      text: parseCost(flight.flightCost) + parseCost(flight.xbagCost) + parseCost(flight.hotelCost),
                      style: 'cell'
                  }
              ],
              [
                  { text: 'Date Of Flight', bold: true, style: 'header' },
                  { text: flight.dateOfFlight ? flight.dateOfFlight : ' ', style: 'cell' },
                  { text: ' ', style: 'cell', colSpan: 4 }
              ]
          ])
        : []

    if (flightBodies.length === 0) {
        return [{}]
    }

    let res = []

    for (var i = 0; i < flightBodies.length; i++) {
        res.push(
            {
                text: `#${i + 1} Flight`,
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
                    widths: ['*', '*', '*', '*', '*', '*'],
                    body: flightBodies[i]
                },

                layout: {
                    paddingTop: function(i, node) {
                        return 2
                    },
                    paddingBottom: function(i, node) {
                        return 2
                    }
                }
            }
        )
    }

    return res
}

// function getComments(staff) {
//     let res = []

//     const commentBodies = staff.comments
//         ? staff.comments.map(comment => [
//               [
//                   { text: 'Created By', bold: true, style: 'header' },
//                   { text: comment.createdBy ? comment.createdBy : ' ', style: 'cell' },
//                   { text: 'Group', bold: true, style: 'header' },
//                   { text: comment.group ? comment.group : ' ', style: 'cell' },
//                   { text: 'Created', bold: true, style: 'header' },
//                   { text: comment.created ? moment(comment.created).format('YYYY-MM-DD') : ' ', style: 'cell' }
//               ],
//               [{ text: 'Comment', bold: true, style: 'header' }, { text: comment.text ? comment.text : ' ', style: 'cell', colSpan: 5 }]
//           ])
//         : []

//     for (var i = 0; i < commentBodies.length; i++) {
//         res.push({
//             margin: i === 0 ? [0, 0, 0, 0] : [0, 10, 0, 0],
//             fontSize: 9,
//             table: {
//                 headerRows: 0,
//                 widths: ['*', '*', '*', '*', '*', '*'],
//                 body: commentBodies[i]
//             },
//             layout: {
//                 paddingTop: function(i, node) {
//                     return 2
//                 },
//                 paddingBottom: function(i, node) {
//                     return 2
//                 }
//             }
//         })
//     }

//     return res
// }

function getComments(staff) {
    const res = staff.comments ? staff.comments.map(comment => [{ text: comment.text ? comment.text : ' ', style: 'cell' }]) : []

    if (res.length === 0) {
        return [{}]
    }

    return res
}

function getDocDefinition(staff) {
    if (!staff) {
        return null
    }

    //Flights
    const flights = getFlights(staff)

    //Comments
    const comments = getComments(staff)

    //Render
    return {
        styles: {
            cell: { fillColor: '#dde4ff' },
            header: { fillColor: '#ccc' }
        },
        pageMargins: 15,
        content: [
            {
                text: `${staff.firstName} ${staff.lastName} ${staff.lastName2 ? staff.lastName2 + ' ' : ''}- ${
                    staff.greenLight === false && staff.status !== constants.Statuses.New ? `Pending HR (${staff.status})` : staff.status
                }`,
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
                    widths: ['*', '*', '*', '*', '*', '*'],
                    body: [
                        [
                            { text: 'Date Of Birth', bold: true, style: 'header' },
                            { text: staff.dateOfBirth ? staff.dateOfBirth : ' ', style: 'cell' },
                            { text: 'Passport Number', bold: true, style: 'header' },
                            { text: staff.passportNumber ? staff.passportNumber : ' ', style: 'cell' },
                            { text: 'Date Of Flight', bold: true, style: 'header' },
                            { text: staff.dateOfFlight ? staff.dateOfFlight : ' ', style: 'cell' }
                        ],
                        [
                            { text: 'Job Title', bold: true, style: 'header' },
                            { text: staff.jobTitle ? staff.jobTitle : ' ', style: 'cell' },
                            { text: 'Phone', bold: true, style: 'header' },
                            { text: staff.phone ? staff.phone : ' ', style: 'cell' },
                            { text: 'Departure Airports', bold: true, style: 'header' },
                            { text: staff.departureAirports ? staff.departureAirports : ' ', style: 'cell' }
                        ],
                        [
                            { text: 'Arrival Airports', bold: true, style: 'header' },
                            { text: staff.arrivalAirports ? staff.arrivalAirports : ' ', style: 'cell' },
                            { text: 'Type Of Flight', bold: true, style: 'header' },
                            { text: staff.typeOfFlight ? staff.typeOfFlight : ' ', style: 'cell' },
                            { text: 'Gender', bold: true, style: 'header' },
                            {
                                text: staff.gender !== undefined && staff.gender !== null ? (staff.gender === 'M' ? 'MALE' : 'FEMALE') : ' ',
                                style: 'cell'
                            }
                        ],
                        [
                            { text: 'Hotel Needed', bold: true, style: 'header' },
                            { text: staff.hotelNeeded === true ? 'YES' : 'NO', style: 'cell' },
                            { text: 'Book Return Flight', bold: true, style: 'header' },
                            { text: staff.bookReturnFlight === true ? 'YES' : 'NO', style: 'cell' },
                            { text: 'Date Of Flight (BRF)', bold: true, style: 'header' },
                            {
                                text: staff.bookReturnFlightDateOfFlight ? staff.bookReturnFlightDateOfFlight : ' ',
                                style: 'cell'
                            }
                        ],
                        [
                            { text: 'Departure Airport (BRF)', bold: true, style: 'header' },
                            { text: staff.bookReturnFlightDepartureAirport ? staff.bookReturnFlightDepartureAirport : ' ', style: 'cell' },
                            { text: 'Arrival Airport (BRF)', bold: true, style: 'header' },
                            { text: staff.bookReturnFlightArrivalAirport ? staff.bookReturnFlightArrivalAirport : ' ', style: 'cell' },
                            { text: 'Rail & Fly (Only In Germany)', bold: true, style: 'header' },
                            { text: staff.railFly === true ? 'YES' : 'NO', style: 'cell' }
                        ],
                        [
                            { text: 'Iata Code', bold: true, style: 'header' },
                            { text: staff.iataCode ? staff.iataCode : ' ', style: 'cell' },
                            { text: 'Planned Assignment Start Date', bold: true, style: 'header' },
                            {
                                text: staff.plannedAssignmentStartDate ? staff.plannedAssignmentStartDate : ' ',
                                style: 'cell'
                            },
                            { text: 'Hotel Name (HN)', bold: true, style: 'header' },
                            { text: staff.hotelNeededHotelName ? staff.hotelNeededHotelName : ' ', style: 'cell' }
                        ],
                        [
                            { text: 'Hotel Start (HN)', bold: true, style: 'header' },
                            {
                                text: staff.hotelNeededHotelStart ? staff.hotelNeededHotelStart : ' ',
                                style: 'cell'
                            },
                            { text: 'Hotel End (HN)', bold: true, style: 'header' },
                            {
                                text: staff.hotelNeededHotelEnd ? staff.hotelNeededHotelEnd : ' ',
                                style: 'cell'
                            },
                            { text: ' ', colSpan: 2 }
                        ]
                    ]
                },
                layout: {
                    paddingTop: function(i, node) {
                        return 2
                    },
                    paddingBottom: function(i, node) {
                        return 2
                    }
                }
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
                    widths: ['*', '*', '*', '*', '*', '*'],
                    body: [
                        [
                            { text: 'Booking Reference', bold: true, style: 'header' },
                            { text: staff.bookingReference ? staff.bookingReference : ' ', style: 'cell' },
                            { text: 'Travel Type', bold: true, style: 'header' },
                            { text: staff.travelType ? staff.travelType : ' ', style: 'cell' },
                            { text: 'Payment Method', bold: true, style: 'header' },
                            { text: staff.paymentMethod ? staff.paymentMethod : ' ', style: 'cell' }
                        ],
                        [
                            { text: 'Luggage', bold: true, style: 'header' },
                            { text: staff.luggage ? staff.luggage : ' ', style: 'cell' },
                            { text: 'Cost Centre', bold: true, style: 'header' },
                            { text: staff.costCentre ? staff.costCentre : ' ', style: 'cell' },
                            { text: 'Currency', bold: true, style: 'header' },
                            { text: staff.currency ? staff.currency : ' ', style: 'cell' }
                        ],
                        [
                            { text: 'Green Light', bold: true, style: 'header' },
                            {
                                text: staff.greenLight !== undefined && staff.greenLight !== null ? (staff.greenLight == true ? 'YES' : 'NO') : ' ',
                                style: 'cell'
                            },
                            { text: ' ', colSpan: 4 }
                        ]
                    ]
                },

                layout: {
                    paddingTop: function(i, node) {
                        return 2
                    },
                    paddingBottom: function(i, node) {
                        return 2
                    }
                }
            },
            flights.map(f => f),
            {
                text: 'Comments',
                style: 'header',
                alignment: 'center',
                bold: true,
                fontSize: 12,
                margin: [0, 4, 0, 5]
            },
            // comments.map(m => m)
            {
                fontSize: 9,
                table: {
                    headerRows: 0,
                    widths: ['*'],
                    body: comments
                },
                layout: {
                    paddingTop: function(i, node) {
                        return 2
                    },
                    paddingBottom: function(i, node) {
                        return 2
                    }
                }
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
