const Yup = require('yup')

const newValidation = Yup.object().shape({
    id: Yup.string()
        .nullable(true)
        .required('Id is required'),
    destination: Yup.string()
        .nullable(true)
        .required('Destination is required'),
    positionStart: Yup.date()
        .typeError('Position start must be a datetime')
        .nullable(true)
        .required('Position start is required')
})

module.exports = newValidation
