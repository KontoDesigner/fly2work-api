const logger = require('tuin-logging')
const xlsx = require('xlsx')
const moment = require('moment')
const constants = require('./constants')

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
                const body = [
                    staff.id,
                    staff.firstName,
                    staff.lastName,
                    staff.passportNumber,
                    staff.dateOfBirth ? moment(staff.dateOfBirth).format('YYYY-MM-DD') : '',
                    staff.sourceMarket,
                    staff.positionStart ? moment(staff.positionStart).format('YYYY-MM-DD') : '',
                    staff.dateOfFlight ? moment(staff.dateOfFlight).format('YYYY-MM-DD') : '',
                    staff.jobTitle,
                    staff.destination,
                    staff.phone,
                    staff.departureAirport,
                    staff.arrivalAirport,
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
                    staff.flightNumber,
                    staff.bookingReference,
                    staff.flightDepartureTime ? moment(staff.flightDepartureTime).format('YYYY-MM-DD') : '',
                    staff.flightArrivalTime ? moment(staff.flightArrivalTime).format('YYYY-MM-DD') : '',
                    staff.paymentMethod,
                    staff.xbag,
                    staff.flightCost,
                    staff.xbagCost,
                    staff.hotelCost,
                    staff.totalCost,
                    staff.costCentre,
                    staff.iataCode,
                    staff.comment ? staff.comment.replace(/\n/g, '') : ''
                ]

                ws_data.push(body)

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
    'Flight Number',
    'Booking Reference',
    'Flight Departure Time',
    'Flight Arrival Time',
    'Payment Method',
    'Xbag',
    'Flight Cost',
    'Xbag Cost',
    'Hotel Cost',
    'Total Cost',
    'Cost Centre',
    'Iata Code',
    'Comment'
]
