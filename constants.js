const keyMirror = require('keymirror')

function Staff() {
    this.id = null
    this.name = null
    this.dateOfBirth = null
    this.sourceMarket = null
    this.hotelStart = null
    this.hotelEnd = null
    this.dateOfFlight = null
    this.role = null
    this.departureAirport = null
    this.arrivalAirport = null
    this.typeOfFlight = null
    this.comment = null
    this.hotelNeeded = null
    this.phone = null
    this.status = null
    this.gender = null
    this.destination = null
    this.positionStart = null
    this.statusUpdated = null
}

const Statuses = keyMirror({
    New: null,
    Submitted: null,
    Pending: null,
    Confirmed: null
})

module.exports = {
    Statuses,
    Staff
}
