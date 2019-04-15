const Yup = require('yup')

const deleteStaffsByOriginalStaffIdValidation = Yup.object().shape({
    originalStaffId: Yup.string()
        .nullable(true)
        .required('Id is required')
})

module.exports = deleteStaffsByOriginalStaffIdValidation
