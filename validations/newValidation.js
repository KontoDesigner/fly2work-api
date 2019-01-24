const Yup = require('yup')

const newValidation = Yup.object().shape({
    id: Yup.string()
        .nullable(true)
        .required('Id is required'),
    destination: Yup.string()
        .nullable(true)
        .required('Destination is required')
})

module.exports = newValidation
