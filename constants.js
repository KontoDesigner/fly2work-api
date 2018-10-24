const keyMirror = require('keymirror')

const Statuses = keyMirror({
    New: null,
    Submitted: null,
    Pending: null,
    Confirmed: null,
    Overview: null
})

module.exports = {
    Statuses
}
