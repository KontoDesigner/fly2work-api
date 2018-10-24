const Yup = require('yup')

const staffValidation = Yup.object().shape({
    // hotelNeeded,
    // gender,
    id: Yup.string()
        .nullable(true)
        .required('Id is required'),
    name: Yup.string()
        .nullable(true)
        .required('Name is required'),
    dateOfBirth: Yup.date()
        .typeError('Date of birth must be a datetime')
        .nullable(true)
        .required('Date of birth is required'),
    sourceMarket: Yup.string()
        .nullable(true)
        .required('Source market is required'),
    phone: Yup.string()
        .nullable(true)
        .required('Phone is required')
})

module.exports = staffValidation
