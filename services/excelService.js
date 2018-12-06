const logger = require('tuin-logging')
const xlsx = require('xlsx')
const constants = require('../infrastructure/constants')
const moment = require('moment')

function generateExcel(staffs, type = 'binary') {
    try {
        var wb = xlsx.utils.book_new()

        logger.info(`Started excel export with ${staffs.length} staff(s)`, { staffs })

        var ws_data = [HEADER]

        const sheetName = `Request(s) (${staffs.length})`

        wb.SheetNames.push(sheetName)

        for (const staff of staffs) {
            const comments = staff.comments
                ? staff.comments.map(c => ({
                      text: c.text,
                      createdBy: c.createdBy,
                      group: c.group,
                      created: c.created ? moment(c.created).format('YYYY-MM-DD HH:mm') : ''
                  }))
                : []

            const body = [
                staff.id,
                //status
                staff.greenLight === false && staff.status !== constants.Statuses.New ? `Pending HR (${staff.status})` : staff.status,
                staff.firstName,
                staff.lastName,
                staff.lastName2,
                staff.passportNumber,
                staff.dateOfBirth ? staff.dateOfBirth : '',
                staff.sourceMarket,
                staff.plannedAssignmentStartDate ? staff.plannedAssignmentStartDate : '',
                staff.preferredFlightDate ? staff.preferredFlightDate : '',
                staff.jobTitle,
                staff.destination,
                staff.phone,
                staff.departureAirports,
                staff.arrivalAirports,
                staff.typeOfFlight,
                staff.iataCode,
                staff.gender !== null && staff.gender !== undefined ? (staff.gender === 'M' ? 'MALE' : 'FEMALE') : '',
                staff.hotelNeeded === true ? 'YES' : 'NO',
                staff.bookReturnFlight === true ? 'YES' : 'NO',
                staff.bookReturnFlightDateOfFlight ? staff.bookReturnFlightDateOfFlight : '',
                staff.bookReturnFlightDepartureAirport ? staff.bookReturnFlightDepartureAirport : '',
                staff.bookReturnFlightArrivalAirport ? staff.bookReturnFlightArrivalAirport : '',
                staff.railFly === true ? 'YES' : 'NO',
                staff.bookingReference ? staff.bookingReference.toUpperCase() : '',
                staff.paymentMethod,
                staff.luggage,
                staff.costCentre,
                staff.currency,
                staff.hotelNeededHotelName,
                staff.hotelNeededHotelStart ? staff.hotelNeededHotelStart : '',
                staff.hotelNeededHotelEnd ? staff.hotelNeededHotelEnd : '',
                staff.travelType,
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
                    body.push(flight.flightCost)
                    body.push(flight.xbagCost)
                    body.push(flight.hotelCost)
                    body.push(parseCost(flight.flightCost) + parseCost(staff.xbagCost) + parseCost(staff.hotelCost))
                } else {
                    body.push('', '', '', '', '', '', '', '', '')
                }
            }

            if (comments && comments.length > 0) {
                body.push(JSON.stringify(comments))
            } else {
                body.push(' ')
            }

            ws_data.push(body)

            logger.info(`Pushed ${staffs.length} staff(s) to sheet`, { staffs })
        }

        var ws = xlsx.utils.aoa_to_sheet(ws_data)
        wb.Sheets[sheetName] = ws

        var wbout = xlsx.write(wb, { bookType: 'xlsx', type: type })

        logger.info('Excel export successfull', { staffs, xlsx: wbout })

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
    'Status',
    'First Name',
    'Surname',
    '2nd Surname',
    'Passport Number',
    'Date Of Birth',
    'Source Market',
    'Planned Assignment Start Date',
    'Preferred Flight Date',
    'Job Title',
    'Destination',
    'Phone',
    'Departure Airports',
    'Arrival Airports',
    'Type Of Flight',
    'Iata Code',
    'Gender',
    'Hotel Needed',
    'Book Return Flight',
    'Date Of Flight (BRF)',
    'Departure Airport (BRF)',
    'Arrival Airport (BRF)',
    'Rail & Fly (Only In Germany)',
    'Booking Reference',
    'Payment Method',
    'Luggage',
    'Cost Centre',
    'Currency',
    'Hotel Name (HN)',
    'Hotel Start (HN)',
    'Hotel End (HN)',
    'Travel Type',
    'Rail & Fly Requested And Booked',
    'Green Light',

    '1st Flight Number',
    '1st Flight Departure Time',
    '1st Flight Arrival Time',
    '1st Departure Airport',
    '1st Arrival Airport',
    '1st Confirmed Flight Date',
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
    '3nd Flight Cost',
    '3nd Xbag Cost',
    '3nd Hotel Cost',
    '3nd Total Cost',

    'Comments'
]
