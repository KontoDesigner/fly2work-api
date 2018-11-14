const Yup = require('yup')
const bsValidation = require('./bsValidation')

const bttValidation = Yup.object().shape({
    flightNumber: Yup.string()
        .nullable(true)
        .required('Flight number is required'),
    bookingReference: Yup.string()
        .nullable(true)
        .required('Booking reference is required'),
    flightDepartureTime: Yup.date()
        .typeError('Flight departure time must be a datetime')
        .nullable(true)
        .required('Flight departure time is required'),
    flightArrivalTime: Yup.date()
        .typeError('Flight arrival time must be a datetime')
        .nullable(true)
        .required('Flight arrival time is required'),
    paymentMethod: Yup.string()
        .nullable(true)
        .required('Payment method is required'),
    xbag: Yup.string()
        .nullable(true)
        .required('Xbag is required'),
    flightCost: Yup.number()
        .nullable(true)
        .required('Flight cost is required'),
    xbagCost: Yup.number()
        .nullable(true)
        .required('Xbag cost is required'),
    hotelCost: Yup.number()
        .nullable(true)
        .required('Hotel cost is required'),
    costCentre: Yup.string()
        .nullable(true)
        .required('Cost centre is required')
})

const combined = bsValidation.concat(bttValidation)

module.exports = combined
