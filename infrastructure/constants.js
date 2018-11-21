const keyMirror = require('keymirror')

function StaffBS() {
    this.id = ''
    this.firstName = ''
    this.lastName = ''
    this.passportNumber = ''
    this.dateOfBirth = ''
    this.sourceMarket = ''
    this.dateOfFlight = ''
    this.jobTitle = ''
    this.departureAirports = ''
    this.arrivalAirports = ''
    this.hotelNeeded = false
    this.hotelNeededHotelStart = ''
    this.hotelNeededHotelEnd = ''
    this.phone = ''
    this.status = ''
    this.gender = ''
    this.destination = ''
    this.positionStart = ''
    this.updated = ''
    this.updatedBy = ''
    this.railFly = false
    this.bookReturnFlight = false
    this.bookReturnFlightDateOfFlight = ''
    this.bookReturnFlightDepartureAirport = ''
    this.bookReturnFlightArrivalAirport = ''
    this.iataCode = ''
    this.typeOfFlight = ''

    this.comments = []
    this.attachments = []
}

function StaffBTT() {
    this.bookingReference = ''
    this.travelType = ''
    this.paymentMethod = ''
    this.xbag = ''
    this.costCentre = ''
    this.flights = [new Flight(true)]
}

function Staff() {
    return { ...new StaffBS(), ...new StaffBTT() }
}

function Flight(enabled = false) {
    this.enabled = enabled
    this.departureAirport = ''
    this.arrivalAirport = ''
    this.flightNumber = ''
    this.flightArrivalTime = ''
    this.flightDepartureTime = ''
    this.hotelCost = 0
    this.flightCost = 0
    this.xbagCost = 0
}

function Email() {
    this.emailUserAddress = null
    this.emailTo = null
    this.ccTo = null
    this.bccTo = null
    this.subject = null
    this.body = null
    this.isBodyHtml = null
    this.attachments = null
}

const UserRoles = keyMirror({
    BS: null,
    BTT: null
})

const Statuses = keyMirror({
    New: null,
    Submitted: null,
    Pending: null,
    Confirmed: null
})

module.exports = {
    Statuses,
    Staff,
    StaffBS,
    StaffBTT,
    Email,
    Flight,
    UserRoles
}
