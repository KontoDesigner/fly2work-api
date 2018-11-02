const Yup = require('yup')
const bsValidation = require('./bsValidation')

const bttValidation = Yup.object().shape({
    test: Yup.string()
        .nullable(true)
        .required('Test is required')
})

const combined = bsValidation.concat(bttValidation)

module.exports = combined
