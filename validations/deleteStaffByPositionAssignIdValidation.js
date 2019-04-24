const Yup = require('yup')

const deleteStaffByPositionAssignIdValidation = Yup.object().shape({
    positionAssignId: Yup.number()
        .nullable(true)
        .required('Position assign id is required')
})

module.exports = deleteStaffByPositionAssignIdValidation
