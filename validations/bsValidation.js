const Yup = require('yup')
const moment = require('moment')

const invalidDate = new Date('')

Yup.addMethod(Yup.date, 'format', function(format) {
    return this.transform((value, input) => {
        const parsed = moment(input, format, true)

        return parsed.isValid() ? parsed.toDate() : invalidDate
    })
})

Yup.addMethod(Yup.string, 'optionalDate', function(format) {
    return this.transform((value, input) => {
        if (input !== '') {
            const parsed = moment(input, format, true)

            return parsed.isValid() ? input : false
        }
    })
})

const bsValidation = Yup.object().shape({
    plannedAssignmentStartDate: Yup.string()
        .default('')
        .nullable(true)
        .typeError('Planned assignment start date must be a datetime')
        .optionalDate('YYYY-MM-DD'),
    typeOfFlight: Yup.string()
        .nullable(true)
        .required('Type of flight is required'),
    id: Yup.string()
        .nullable(true)
        .required('Id is required'),
    passportNumber: Yup.string()
        .nullable(true)
        .required('Passport number is required'),
    firstName: Yup.string()
        .nullable(true)
        .required('First name is required'),
    lastName: Yup.string()
        .nullable(true)
        .required('Sur name is required'),
    dateOfBirth: Yup.date()
        .format('DD/MM/YYYY')
        .typeError('Date of birth must be a datetime')
        .nullable(true)
        .required('Date of birth is required'),
    sourceMarket: Yup.string()
        .nullable(true)
        .required('Source market is required'),
    dateOfFlight: Yup.date()
        .format('YYYY-MM-DD')
        .typeError('Date of flight must be a datetime')
        .nullable(true)
        .required('Date of flight is required'),
    jobTitle: Yup.string()
        .nullable(true)
        .required('Job title is required'),
    destination: Yup.string()
        .nullable(true)
        .required('Destination is required'),
    phone: Yup.string()
        .nullable(true)
        .required('Phone is required'),
    departureAirports: Yup.array()
        .min(1, 'Min 1 departure airport')
        .max(3, 'Max 3 departure airports')
        .required('Departure airports is required')
        .nullable(true),
    arrivalAirports: Yup.array()
        .min(1, 'Min 1 arrival airport')
        .max(3, 'Max 3 arrival airports')
        .required('Arrival airports is required')
        .nullable(true),
    status: Yup.string()
        .nullable()
        .required('Status is required'),
    gender: Yup.string()
        .nullable(true)
        .required('Gender is required'),
    railFly: Yup.boolean()
        .nullable(true)
        .required('Rail & Fly is required'),
    hotelNeeded: Yup.boolean()
        .nullable(true)
        .required('Hotel needed is required'),
    bookReturnFlight: Yup.boolean()
        .nullable(true)
        .required('Book return flight is required'),
    bookReturnFlightDepartureAirport: Yup.mixed()
        .nullable(true)
        .when('bookReturnFlight', {
            is: true,
            then: Yup.string()
                .nullable(true)
                .required('(BRF) Departure Airport is required')
        }),
    bookReturnFlightArrivalAirport: Yup.mixed()
        .nullable(true)
        .when('bookReturnFlight', {
            is: true,
            then: Yup.string()
                .nullable(true)
                .required('(BRF) Arrival Airport is required')
        }),
    bookReturnFlightDateOfFlight: Yup.mixed()
        .nullable(true)
        .when('bookReturnFlight', {
            is: true,
            then: Yup.date()
                .format('YYYY-MM-DD')
                .typeError('(BRF) Date Of Flight must be a datetime')
                .nullable(true)
                .required('(BRF) Date Of Flight is required')
        }),
    iataCode: Yup.string()
        .nullable(true)
        .required('Iata code is required')
})

module.exports = bsValidation
