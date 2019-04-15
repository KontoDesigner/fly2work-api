const Yup = require('yup')

const deleteStaffValidation = Yup.object().shape({
    id: Yup.string()
        .nullable(true)
        .required('Id is required')
})

module.exports = deleteStaffValidation
