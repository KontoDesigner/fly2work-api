const Yup = require('yup')

const newValidation = Yup.object().shape({
    id: Yup.string()
        .nullable(true)
        .required('Id is required'),
    destination: Yup.string()
        .nullable(true)
        .required('Destination is required'),
    direction: Yup.string()
        .nullable(true)
        .required('Direction is required'),
    plannedAssignmentStartDate: Yup.date()
        .format('DD/MM/YYYY')
        .typeError('Incorrect planned assignment start date format (DD/MM/YYYY)')
        .nullable(true)
        .required('Planned assignment start date is required')
})

module.exports = newValidation
