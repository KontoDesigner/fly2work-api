const keyMirror = require('keymirror')

function Staff() {
    this.id = ''
    this.name = ''
    this.dateOfBirth = ''
    this.sourceMarket = ''
    this.hotelStart = ''
    this.hotelEnd = ''
    this.dateOfFlight = ''
    this.role = ''
    this.departureAirport = ''
    this.arrivalAirport = ''
    this.typeOfFlight = ''
    this.comment = ''
    this.hotelNeeded = ''
    this.phone = ''
    this.status = ''
    this.gender = ''
    this.destination = ''
    this.positionStart = ''
    this.statusUpdated = ''
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
