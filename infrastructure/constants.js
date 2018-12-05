const keyMirror = require('keymirror')

function StaffBS() {
    this.id = ''
    this.firstName = ''
    this.lastName = ''
    this.lastName2 = ''
    this.passportNumber = ''
    this.dateOfBirth = ''
    this.sourceMarket = ''
    this.dateOfFlight = ''
    this.jobTitle = ''
    this.departureAirports = ''
    this.arrivalAirports = ''
    this.hotelNeeded = false
    this.phone = ''
    this.status = ''
    this.gender = ''
    this.destination = ''
    this.plannedAssignmentStartDate = ''
    this.railFly = false
    this.bookReturnFlight = false
    this.bookReturnFlightDateOfFlight = ''
    this.bookReturnFlightDepartureAirport = ''
    this.bookReturnFlightArrivalAirport = ''
    this.iataCode = ''
    this.typeOfFlight = ''

    this.created = ''
    this.createdBy = null
    this.createdByEmail = null
    this.comments = []
    this.attachments = []
    this.emails = []
    this.audit = []
}

function StaffBTT() {
    this.bookingReference = ''
    this.travelType = ''
    this.paymentMethod = ''
    this.luggage = ''
    this.costCentre = ''
    this.hotelNeededHotelName = ''
    this.hotelNeededHotelStart = ''
    this.hotelNeededHotelEnd = ''
    this.flights = [new Flight(true)]
    this.greenLight = null
    this.greenLightUpdated = null
    this.greenLightUpdatedBy = null
    this.currency = null
}

function Staff() {
    return Object.assign(new StaffBS(), new StaffBTT())
}

function Flight() {
    this.departureAirport = ''
    this.arrivalAirport = ''
    this.flightNumber = ''
    this.flightArrivalTime = ''
    this.flightDepartureTime = ''
    this.hotelCost = 0
    this.flightCost = 0
    this.xbagCost = 0
    this.dateOfFlight = ''
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

const UserRoles = keyMirror({
    BS: null,
    BTT: null
})

const Statuses = keyMirror({
    New: null,
    PendingBTT: null,
    PendingDES: null,
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
