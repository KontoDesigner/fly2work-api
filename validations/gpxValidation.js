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
        .required('Phone is required'),
    gender: Yup.string()
        .nullable(true)
        .required('Gender is required'),
    destination: Yup.string()
        .nullable(true)
        .required('Destination is required'),
    positionStart: Yup.date()
        .typeError('Position start must be a datetime')
        .nullable(true)
        .required('Position start is required')
})

module.exports = staffValidation
