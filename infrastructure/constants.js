const keyMirror = require('keymirror')

function StaffBS() {
    this.id = ''
    this.originalStaffId = null
    this.direction = null
    this.firstName = ''
    this.lastName = ''
    this.lastName2 = ''
    this.passportNumber = ''
    this.dateOfBirth = ''
    this.sourceMarket = ''
    this.preferredFlightDate = ''
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
    this.positionAssignId = null
    this.created = ''
    this.requestedBy = {}
    this.confirmedStatus = null
    this.dateOfConfirmation = null
    this.dateRequested = null
    //Insert
    this.comment = ''
    //Update
    this.comments = []
    this.attachments = []
    this.emails = []
    this.sentEmails = []
    this.audit = []
}

function StaffBTT() {
    this.flights = [new Flight(true)]
    this.greenLight = null
    this.greenLightUpdated = null
    this.greenLightUpdatedBy = null
    this.greenLightUpdatedByEmail = null
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
    this.confirmedFlightDate = ''
    this.hotelNeededHotelName = ''
    this.hotelNeededHotelStart = ''
    this.hotelNeededHotelEnd = ''
    this.bookingReference = ''
    this.travelType = ''
    this.paymentMethod = ''
    this.luggage = ''
    this.costCentre = ''
    this.railFlyRequestedAndBooked = false
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
    BTT: null,
    HR: null
})

const Statuses = keyMirror({
    New: null,
    PendingBTT: null,
    PendingDES: null,
    Confirmed: null
})

const ConfirmedStatuses = keyMirror({
    Cancelled: null,
    Modified: null
})

function EmailRecipients() {
    this.to = []
    this.cc = []
}

module.exports = {
    Statuses,
    ConfirmedStatuses,
    Staff,
    StaffBS,
    StaffBTT,
    Email,
    Flight,
    UserRoles,
    EmailRecipients
}
