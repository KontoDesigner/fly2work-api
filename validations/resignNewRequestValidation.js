const Yup = require('yup')

const resignNewRequestValidation = Yup.object().shape({
    id: Yup.string()
        .nullable(true)
        .required('Id is required'),
    destination: Yup.string()
        .nullable(true)
        .required('Destination is required'),
    direction: Yup.string()
        .nullable(true)
        .required('Direction is required')
})

module.exports = resignNewRequestValidation
