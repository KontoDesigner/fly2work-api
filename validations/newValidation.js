const Yup = require('yup')

const staffValidation = Yup.object().shape({
    id: Yup.string()
        .nullable(true)
        .required('Id is required'),
    name: Yup.string()
        .nullable(true)
        .required('Name is required'),
    dateOfBirth: Yup.date()
        .typeError('Date of birth must be a datetime')
        .nullable(true)
        .required('Date of birth is required'),
    sourceMarket: Yup.string()
        .nullable(true)
        .required('Source market is required'),
    hotelStart: Yup.date()
        .typeError('Hotel start must be a datetime')
        .nullable(true)
        .required('Hotel start is required'),
    hotelEnd: Yup.date()
        .typeError('Hotel end must be a datetime')
        .nullable(true)
        .required('Hotel end is required'),
    positionStart: Yup.date()
        .typeError('Position start must be a datetime')
        .nullable(true)
        .required('Position start is required'),
    dateOfFlight: Yup.date()
        .typeError('Date of flight must be a datetime')
        .nullable(true)
        .required('Date of flight is required'),
    role: Yup.string()
        .nullable(true)
        .required('Role is required'),
    destination: Yup.string()
        .nullable(true)
        .required('Destination is required'),
    phone: Yup.string()
        .nullable(true)
        .required('Phone is required'),
    departureAirport: Yup.array()
        .min(1, 'Min 1 departure airport')
        .max(3, 'Max 3 departure airports')
        .required('Departure airport is required')
        .nullable(true),
    arrivalAirport: Yup.array()
        .min(1, 'Min 1 arrival airport')
        .max(3, 'Max 3 arrival airports')
        .required('Arrival airport is required')
        .nullable(true),
    typeOfFlight: Yup.string()
        .nullable(true)
        .required('Type of flight is required'),
    comment: Yup.string()
        .nullable(true)
        .max(200, 'Comment must contain a total 200 characters'),
    status: Yup.string()
        .nullable()
        .required('Status is required'),
    hotelNeeded: Yup.boolean()
        .nullable(true)
        .required('Hotel needed is required'),
    gender: Yup.string()
        .nullable(true)
        .required('Gender is required')
})

module.exports = staffValidation
