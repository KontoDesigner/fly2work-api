const logger = require('tuin-logging')
const xlsx = require('xlsx')
const moment = require('moment')
const constants = require('../infrastructure/constants')

function generateExcel(staffs, type = 'binary') {
    try {
        var wb = xlsx.utils.book_new()

        const statuses = Object.keys(constants.Statuses).map(s => constants.Statuses[s])

        logger.info(`Started excel export with ${staffs.length} staff(s) and ${statuses.length} status(es)`, { staffs, statuses })

        for (const status of statuses) {
            var ws_data = [HEADER]

            const filteredStaffs = staffs.filter(s => s.status === status)

            const sheetName = `${status} (${filteredStaffs.length})`

            wb.SheetNames.push(sheetName)

            for (const staff of filteredStaffs) {
                const comments = staff.comments
                    ? staff.comments.map(c => ({
                          text: c.text,
                          createdBy: c.createdBy,
                          group: c.group,
                          created: c.created
                      }))
                    : []

                for (var flight of staff.flights) {
                    const body = [
                        staff.id,
                        staff.firstName,
                        staff.lastName,
                        staff.passportNumber,
                        staff.dateOfBirth ? moment(staff.dateOfBirth).format('DD/MM/YYYY') : '',
                        staff.sourceMarket,
                        staff.positionStart ? moment(staff.positionStart).format('YYYY-MM-DD') : '',
                        staff.dateOfFlight ? moment(staff.dateOfFlight).format('YYYY-MM-DD') : '',
                        staff.jobTitle,
                        staff.destination,
                        staff.phone,
                        staff.departureAirports,
                        staff.arrivalAirports,
                        staff.typeOfFlight,
                        staff.gender ? (staff.gender === 'M' ? 'MALE' : 'FEMALE') : '',
                        staff.hotelNeeded === true ? 'YES' : 'NO',
                        staff.hotelNeededHotelStart ? moment(staff.hotelNeededHotelStart).format('YYYY-MM-DD') : '',
                        staff.hotelNeededHotelEnd ? moment(staff.hotelNeededHotelEnd).format('YYYY-MM-DD') : '',
                        staff.bookReturnFlight === true ? 'YES' : 'NO',
                        staff.bookReturnFlightDateOfFlight ? moment(staff.bookReturnFlightDateOfFlight).format('YYYY-MM-DD') : '',
                        staff.bookReturnFlightDepartureAirport ? staff.bookReturnFlightDepartureAirport : '',
                        staff.bookReturnFlightArrivalAirport ? staff.bookReturnFlightArrivalAirport : '',
                        staff.railFly === true ? 'YES' : 'NO',
                        staff.iataCode,
                        staff.bookingReference,
                        staff.paymentMethod,
                        staff.xbag,
                        staff.costCentre,
                        staff.travelType,

                        flight.flightNumber,
                        flight.flightDepartureTime ? moment(flight.flightDepartureTime).format('YYYY-MM-DD') : '',
                        flight.flightArrivalTime ? moment(flight.flightArrivalTime).format('YYYY-MM-DD') : '',
                        flight.departureAirport,
                        flight.arrivalAirport,
                        flight.flightCost,
                        flight.xbagCost,
                        flight.hotelCost,
                        parseCost(flight.flightCost) + parseCost(staff.xbagCost) + parseCost(staff.hotelCost),

                        JSON.stringify(comments)
                    ]

                    ws_data.push(body)
                }

                logger.info(`Pushed ${filteredStaffs.length} staff(s) to ${status} sheet`, { staffs, status })
            }

            var ws = xlsx.utils.aoa_to_sheet(ws_data)
            wb.Sheets[sheetName] = ws
        }

        var wbout = xlsx.write(wb, { bookType: 'xlsx', type: type })

        return Buffer.from(wbout, type)
    } catch (err) {
        logger.error('Error generating excel', err, { staffs })

        throw err
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
    generateExcel
}

const HEADER = [
    'Id',
    'First Name',
    'Last Name',
    'Passport Number',
    'Date Of Birth',
    'Source Market',
    'Planned Assignment Start Date',
    'Date Of Flight',
    'Job Title',
    'Destination',
    'Phone',
    'Departure Airport',
    'Arrival Airport',
    'Type Of Flight',
    'Gender',
    'Hotel Needed',
    'Hotel Start (HN)',
    'Hotel End (HN)',
    'Book Return Flight',
    'Date Of Flight (BRF)',
    'Departure Airport (BRF)',
    'Arrival Airport (BRF)',
    'Rail & Fly',
    'Iata Code',
    'Booking Reference',
    'Payment Method',
    'Xbag',
    'Cost Centre',
    'Travel Type',
    'Flight Number',
    'Flight Departure Time',
    'Flight Arrival Time',
    'Departure Airport',
    'Arrival Airport',
    'Flight Cost',
    'Xbag Cost',
    'Hotel Cost',
    'Total Cost',
    'Comments'
]