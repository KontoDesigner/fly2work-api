const logger = require('tuin-logging')
const xlsx = require('xlsx')
const moment = require('moment')

function generateExcel(staff) {
    try {
        var wb = xlsx.utils.book_new()

        wb.SheetNames.push(staff.name)

        const header = [
            'Id',
            'Name',
            'Date Of Birth',
            'Source Market',
            'Position Start',
            'Date Of Flight',
            'Role',
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
            'Arrival Time',
            'Payment Method',
            'Xbag',
            'Flight Cost',
            'Xbag Cost',
            'Hotel Cost',
            'Total Cost',
            'Cost Centre',
            'Status',
            'Comment'
        ]

        const body = [
            staff.id,
            staff.name,
            staff.dateOfBirth ? moment(staff.dateOfBirth).format('YYYY-MM-DD') : '',
            staff.sourceMarket,
            staff.positionStart ? moment(staff.positionStart).format('YYYY-MM-DD') : '',
            staff.dateOfFlight ? moment(staff.dateOfFlight).format('YYYY-MM-DD') : '',
            staff.role,
            staff.destination,
            staff.phone,
            staff.departureAirport,
            staff.arrivalAirport,
            staff.typeOfFlight,
            staff.gender ? (staff.gender === 'M' ? 'MALE' : 'FEMALE') : '',
            staff.hotelNeeded ? (staff.hotelNeeded === true ? 'YES' : 'NO') : '',
            staff.hotelNeededHotelStart ? moment(staff.hotelNeededHotelStart).format('YYYY-MM-DD') : '',
            staff.hotelNeededHotelEnd ? moment(staff.hotelNeededHotelEnd).format('YYYY-MM-DD') : '',
            staff.bookReturnFlight ? (staff.bookReturnFlight === true ? 'YES' : 'NO') : '',
            staff.bookReturnFlightDateOfFlight ? moment(staff.bookReturnFlightDateOfFlight).format('YYYY-MM-DD') : '',
            staff.bookReturnFlightDepartureAirport ? staff.bookReturnFlightDepartureAirport : '',
            staff.bookReturnFlightArrivalAirport ? staff.bookReturnFlightArrivalAirport : '',
            staff.railFly ? (staff.railFly === true ? 'YES' : 'NO') : '',
            staff.flightNumber,
            staff.bookingReference,
            staff.arrivalTime ? moment(staff.arrivalTime).format('YYYY-MM-DD') : '',
            staff.paymentMethod,
            staff.xbag,
            staff.flightCost,
            staff.xbagCost,
            staff.hotelCost,
            staff.totalCost,
            staff.costCentre,
            staff.status,
            staff.comment ? staff.comment.replace(/\n/g, '') : ''
        ]

        var ws_data = [header, body]
        var ws = xlsx.utils.aoa_to_sheet(ws_data)
        wb.Sheets[staff.name] = ws

        var wbout = xlsx.write(wb, { bookType: 'xlsx', type: 'binary' })

        return Buffer.from(wbout, 'binary')
    } catch (err) {
        logger.error('Error generating excel', err, { staff })

        throw err
    }
}

module.exports = {
    generateExcel
}
