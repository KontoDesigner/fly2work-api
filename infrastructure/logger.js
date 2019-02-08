const tuinlogger = require('tuin-logging')

function info(message, extra) {
    const extraCopy = removeAttachments(extra)

    tuinlogger.info(message, extraCopy)
}

function warning(message, extra) {
    const extraCopy = removeAttachments(extra)

    tuinlogger.warning(message, extraCopy)
}

function error(message, err, extra) {
    const extraCopy = removeAttachments(extra)

    tuinlogger.error(message, err, extraCopy)
}

function removeAttachments(extra) {
    if (!extra) {
        return extra
    }

    const extraCopy = JSON.parse(JSON.stringify(extra))

    if (extraCopy && extraCopy.model && extraCopy.model.attachments) {
        extraCopy.model.attachments = extraCopy.model.attachments.length
    }

    if (extraCopy && extraCopy.staff && extraCopy.staff.attachments) {
        extraCopy.staff.attachments = extraCopy.staff.attachments.length
    }

    if (extraCopy && extraCopy.res && extraCopy.res.attachments) {
        extraCopy.res.attachments = extraCopy.res.attachments.length
    }

    return extraCopy
}

module.exports = {
    info,
    warning,
    error
}
