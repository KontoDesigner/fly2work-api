const Yup = require('yup')

const deleteStaffByOriginalStaffIdValidation = Yup.object().shape({
    originalStaffId: Yup.string()
        .nullable(true)
        .required('Original staff id is required')
})

module.exports = deleteStaffByOriginalStaffIdValidation
