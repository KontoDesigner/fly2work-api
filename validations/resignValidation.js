const Yup = require('yup')

const resignValidation = Yup.object().shape({
    originalStaffId: Yup.string()
        .nullable(true)
        .required('Id is required')
})

module.exports = resignValidation
