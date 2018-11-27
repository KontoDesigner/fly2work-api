const Yup = require('yup')
const bsValidation = require('./bsValidation')

const bttValidation = Yup.object().shape({
    bookingReference: Yup.string()
        .nullable(true)
        .required('Booking reference is required'),
    paymentMethod: Yup.string()
        .nullable(true)
        .required('Payment method is required'),
    travelType: Yup.string()
        .nullable(true)
        .required('Travel type is required'),
    xbag: Yup.string()
        .nullable(true)
        .required('Xbag is required'),
    costCentre: Yup.string()
        .nullable(true)
        .required('Cost centre is required'),
    currency: Yup.string()
        .nullable(true)
        .required('Currency is required'),
    flights: Yup.array()
        .of(
            Yup.object().shape({
                flightNumber: Yup.string()
                    .nullable(true)
                    .required('Flight number is required'),
                flightDepartureTime: Yup.date()
                    .typeError('Flight departure time must be a datetime')
                    .nullable(true)
                    .required('Flight departure time is required'),
                flightArrivalTime: Yup.date()
                    .typeError('Flight arrival time must be a datetime')
                    .nullable(true)
                    .required('Flight arrival time is required'),
                departureAirport: Yup.string()
                    .nullable(true)
                    .required('Departure airport is required'),
                arrivalAirport: Yup.string()
                    .nullable(true)
                    .required('Arrival airport is required'),
                flightCost: Yup.number()
                    .typeError('Flight cost must be a number')
                    .nullable(true)
                    .required('Flight cost is required'),
                xbagCost: Yup.number()
                    .typeError('Xbag cost must be a number')
                    .nullable(true)
                    .required('Xbag cost is required'),
                hotelCost: Yup.number()
                    .typeError('Hotel cost must be a number')
                    .nullable(true)
                    .required('Hotel cost is required')
            })
        )
        .min(1, 'Min 1 flight')
        .max(3, 'Max 3 flights')
        .required('Flight is required')
        .nullable(true)
})

const combined = bsValidation.concat(bttValidation)

module.exports = combined
