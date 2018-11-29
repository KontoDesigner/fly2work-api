const Yup = require('yup')

const bsValidation = Yup.object().shape({
    text: Yup.string()
        .nullable(true)
        .required('Field must be filled in')
        .max(200, 'Field must contain a total 200 characters')
})

module.exports = bsValidation
