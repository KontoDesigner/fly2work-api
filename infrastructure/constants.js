const keyMirror = require('keymirror')

function Staff() {
    this.id = undefined
    this.name = undefined
    this.dateOfBirth = undefined
    this.sourceMarket = undefined
    this.hotelStart = undefined
    this.hotelEnd = undefined
    this.dateOfFlight = undefined
    this.role = undefined
    this.departureAirport = undefined
    this.arrivalAirport = undefined
    this.typeOfFlight = undefined
    this.comment = undefined
    this.hotelNeeded = undefined
    this.phone = undefined
    this.status = undefined
    this.gender = undefined
    this.destination = undefined
    this.positionStart = undefined
    this.statusUpdated = undefined
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
