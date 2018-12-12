const logger = require('tuin-logging')
const xlsx = require('xlsx')
const constants = require('../infrastructure/constants')
const moment = require('moment')

function generateExcel(staffs, type = 'binary') {
    try {
        var wb = xlsx.utils.book_new()

        logger.info('Started excel export', { count: staffs.length })

        var ws_data = [HEADER]

        const sheetName = `Request(s) (${staffs.length})`

        wb.SheetNames.push(sheetName)

        for (const staff of staffs) {
            const body = [
                staff.id,
                staff.greenLight === false && staff.status !== constants.Statuses.New ? `Pending HR (${staff.status})` : staff.status,
                staff.confirmedStatus ? staff.confirmedStatus : '',
                staff.gender !== null && staff.gender !== undefined ? (staff.gender === 'M' ? 'MALE' : 'FEMALE') : '',
                staff.firstName,
                staff.lastName,
                staff.lastName2,
                staff.dateOfBirth ? staff.dateOfBirth : '',
                staff.phone,
                staff.passportNumber,
                staff.jobTitle,
                staff.plannedAssignmentStartDate ? staff.plannedAssignmentStartDate : '',
                staff.preferredFlightDate ? staff.preferredFlightDate : '',
                staff.sourceMarket,
                staff.destination,
                staff.departureAirports && staff.departureAirports.length > 0 ? staff.departureAirports.join(', ') : '',
                staff.arrivalAirports && staff.arrivalAirports.length > 0 ? staff.arrivalAirports.join(', ') : '',
                staff.typeOfFlight,
                staff.iataCode,
                staff.emails && staff.emails.length > 0 ? staff.emails.join(', ') : '',
                staff.hotelNeeded === true ? 'YES' : 'NO',
                staff.bookReturnFlight === true ? 'YES' : 'NO',
                staff.bookReturnFlightDateOfFlight ? staff.bookReturnFlightDateOfFlight : '',
                staff.bookReturnFlightDepartureAirport ? staff.bookReturnFlightDepartureAirport : '',
                staff.bookReturnFlightArrivalAirport ? staff.bookReturnFlightArrivalAirport : '',
                staff.railFly === true ? 'YES' : 'NO',
                staff.bookingReference ? staff.bookingReference.toUpperCase() : '',
                staff.travelType,
                staff.paymentMethod,
                staff.luggage,
                staff.costCentre,
                staff.currency,
                staff.railFlyRequestedAndBooked === true ? 'YES' : 'NO',
                staff.greenLight !== undefined && staff.greenLight !== null ? (staff.greenLight == true ? 'YES' : 'NO') : ''
            ]

            for (var i = 0; i < 3; i++) {
                const flight = staff.flights[i]

                if (flight) {
                    body.push(flight.flightNumber ? flight.flightNumber.toUpperCase() : '')
                    body.push(flight.flightDepartureTime ? flight.flightDepartureTime : '')
                    body.push(flight.flightArrivalTime ? flight.flightArrivalTime : '')
                    body.push(flight.departureAirport ? flight.departureAirport.toUpperCase() : '')
                    body.push(flight.arrivalAirport ? flight.arrivalAirport.toUpperCase() : '')
                    body.push(flight.confirmedFlightDate ? flight.confirmedFlightDate : '')
                    body.push(flight.hotelNeededHotelName)
                    body.push(flight.hotelNeededHotelStart)
                    body.push(flight.hotelNeededHotelEnd)
                    body.push(flight.flightCost)
                    body.push(flight.xbagCost)
                    body.push(flight.hotelCost)
                    body.push(parseCost(flight.flightCost) + parseCost(staff.xbagCost) + parseCost(staff.hotelCost))
                } else {
                    body.push('', '', '', '', '', '', '', '', '', '', '', '', '')
                }
            }

            if (staff.comments && staff.comments.length > 0) {
                var comments = staff.comments[0].text

                if (staff.comments.length > 1) {
                    staff.comments.shift()

                    comments = comments + ',' + Array.prototype.map.call(staff.comments, s => ' ' + s.text).toString()
                }

                body.push(comments)
            } else {
                body.push(' ')
            }

            ws_data.push(body)

            // logger.info(`Pushed ${staffs.length} staff(s) to sheet`, { staffs })
        }

        var ws = xlsx.utils.aoa_to_sheet(ws_data)
        wb.Sheets[sheetName] = ws

        var wbout = xlsx.write(wb, { bookType: 'xlsx', type: type })

        logger.info('Excel export successfull', { count: staffs.length })

        return Buffer.from(wbout, type)
    } catch (err) {
        logger.error('Error generating excel', err, { count: staffs.length })

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
    'Status',
    'Confirmed Status',
    'Gender',
    'First Name',
    'Surname',
    '2nd Surname',
    'Date Of Birth',
    'Phone',
    'Passport Number',
    'Job Title',
    'Planned Assignment Start Date',
    'Preferred Flight Date',
    'Source Market',
    'Destination',
    'Departure Airports',
    'Arrival Airports',
    'Type Of Flight',
    'Iata Code',
    'Additional Emails For Notification',
    'Hotel Needed',
    'Book Return Flight',
    'Date Of Flight (BRF)',
    'Departure Airport (BRF)',
    'Arrival Airport (BRF)',
    'Rail & Fly (Only In Germany)',
    'Booking Reference',
    'Travel Type',
    'Payment Method',
    'Luggage',
    'Cost Centre',
    'Currency',
    'Rail & Fly Requested And Booked',
    'Green Light',

    '1st Flight Number',
    '1st Flight Departure Time',
    '1st Flight Arrival Time',
    '1st Departure Airport',
    '1st Arrival Airport',
    '1st Confirmed Flight Date',
    '1st Hotel Name (HN)',
    '1st Hotel Start (HN)',
    '1st Hotel End (HN)',
    '1st Flight Cost',
    '1st Xbag Cost',
    '1st Hotel Cost',
    '1st Total Cost',

    '2nd Flight Number',
    '2nd Flight Departure Time',
    '2nd Flight Arrival Time',
    '2nd Departure Airport',
    '2nd Arrival Airport',
    '2st Confirmed Flight Date',
    '2st Hotel Name (HN)',
    '2st Hotel Start (HN)',
    '2st Hotel End (HN)',
    '2nd Flight Cost',
    '2nd Xbag Cost',
    '2nd Hotel Cost',
    '2nd Total Cost',

    '3nd Flight Number',
    '3nd Flight Departure Time',
    '3nd Flight Arrival Time',
    '3nd Departure Airport',
    '3nd Arrival Airport',
    '3st Confirmed Flight Date',
    '3st Hotel Name (HN)',
    '3st Hotel Start (HN)',
    '3st Hotel End (HN)',
    '3nd Flight Cost',
    '3nd Xbag Cost',
    '3nd Hotel Cost',
    '3nd Total Cost',

    'Comments'
]
