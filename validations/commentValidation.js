const Yup = require('yup')

const bsValidation = Yup.object().shape({
    text: Yup.string()
        .nullable(true)
        .required('Field must be filled in')
        .max(1500, 'Field must contain a total 1500 characters')
})

module.exports = bsValidation
