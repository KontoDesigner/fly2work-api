const Yup = require('yup')

const declineValidation = Yup.object().shape({
    id: Yup.string()
        .nullable(true)
        .required('Id is required'),
    text: Yup.string()
        .nullable(true)
        .required('Comment must be filled in')
        .max(200, 'Comment must contain a total 200 characters')
})

module.exports = declineValidation
