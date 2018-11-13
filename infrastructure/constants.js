const keyMirror = require('keymirror')

function Staff() {
    //BS
    this.id = ''
    this.firstName = ''
    this.lastName = ''
    this.passportNumber = ''
    this.dateOfBirth = ''
    this.sourceMarket = ''
    this.dateOfFlight = ''
    this.jobTitle = ''
    this.departureAirport = ''
    this.arrivalAirport = ''
    this.hotelNeeded = false
    this.hotelNeededHotelStart = ''
    this.hotelNeededHotelEnd = ''
    this.phone = ''
    this.status = ''
    this.gender = ''
    this.destination = ''
    this.positionStart = ''
    this.statusUpdated = ''
    this.railFly = false
    this.bookReturnFlight = false
    this.bookReturnFlightDateOfFlight = ''
    this.bookReturnFlightDepartureAirport = ''
    this.bookReturnFlightArrivalAirport = ''

    //BTT
    this.flightNumber = ''
    this.bookingReference = ''
    this.arrivalTime = ''
    this.typeOfFlight = ''
    this.typeOfFlight = ''
    this.paymentMethod = ''
    this.xbag = ''
    this.flightCost = ''
    this.xbagCost = ''
    this.hotelCost = ''
    this.totalCost = ''
    this.costCentre = ''
    this.iataCode = ''

    //ALL
    this.comment = ''
    this.attachments = []
}

function Email() {
    this.userAddress = null
    this.emailTo = null
    this.ccTo = null
    this.bccTo = null
    this.subject = null
    this.body = null
    this.isBodyHtml = null
    this.attachments = null
}

const Statuses = keyMirror({
    New: null,
    Submitted: null,
    Pending: null,
    Confirmed: null
})

module.exports = {
    Statuses,
    Staff,
    Email
}
