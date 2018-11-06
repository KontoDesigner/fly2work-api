const Yup = require('yup')
const bsValidation = require('./bsValidation')

const bttValidation = Yup.object().shape({
    flightNumber: Yup.string()
        .nullable(true)
        .required('Flight number is required'),
    bookingReference: Yup.string()
        .nullable(true)
        .required('Booking reference is required'),
    arrivalTime: Yup.date()
        .typeError('Arrival time must be a datetime')
        .nullable(true)
        .required('Arrival time is required'),
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
    totalCost: Yup.number()
        .nullable(true)
        .required('Total cost is required'),
    costCentre: Yup.string()
        .nullable(true)
        .required('Cost centre is required')
})

const combined = bsValidation.concat(bttValidation)

module.exports = combined
