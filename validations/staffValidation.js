const Yup = require('yup')

const staffValidation = Yup.object().shape({
    // hotelNeeded,
    // gender,
    id: Yup.string()
        .nullable(true)
        .required('Id is required')
})

module.exports = staffValidation
