const keyMirror = require('keymirror')

function Staff() {
    //BS
    this.id = ''
    this.name = ''
    this.dateOfBirth = ''
    this.sourceMarket = ''
    this.dateOfFlight = ''
    this.role = ''
    this.roleConcept = ''
    this.departureAirport = ''
    this.arrivalAirport = ''
    this.comment = ''
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

    //ALL
    this.comments = ''
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
