const Yup = require('yup')

const newValidation = Yup.object().shape({
    id: Yup.string()
        .nullable(true)
        .required('Id is required'),
    destination: Yup.string()
        .nullable(true)
        .required('Destination is required'),
    plannedAssignmentStartDate: Yup.date()
        .typeError('Planned assignment start date must be a datetime')
        .nullable(true)
        .required('Planned assignment start date is required')
})

module.exports = newValidation
