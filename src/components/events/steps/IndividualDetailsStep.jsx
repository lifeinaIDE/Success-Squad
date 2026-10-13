/**
 * IndividualDetailsStep.jsx - Step 1 for individual-registration events.
 *
 * Used by Illuminate Workshop (registrationType: 'individual').
 * Fields: Full Name, Phone, Email, College, Address, Year, Department.
 * No Team Name. Stores data as { individualData: {...} } so downstream
 * PaymentStep and ConfirmationStep can render it cleanly.
 */

import { useState, useEffect } from 'react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[6-9]\d{9}$/

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Alumni / Other']

function validate(values) {
  const errors = {}
  if (!values.name.trim())           errors.name       = 'Full name is required.'
  if (!PHONE_RE.test(values.phone))  errors.phone      = 'Enter a valid 10-digit mobile number.'
  if (!EMAIL_RE.test(values.email))  errors.email      = 'Enter a valid email address.'
  if (!values.college.trim())        errors.college    = 'College name is required.'
  if (!values.address.trim())        errors.address    = 'Address is required.'
  if (!values.year)                  errors.year       = 'Please select your year.'
  if (!values.department.trim())     errors.department = 'Department is required.'
  return errors
}

export default function IndividualDetailsStep({ config, initialData, onSubmit }) {
  const [values, setValues] = useState(() => initialData?.individualData ?? {
    name:       '',
    phone:      '',
    email:      '',
    college:    '',
    address:    '',
    year:       '',
    department: '',
  })
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (initialData?.individualData) setValues(initialData.individualData)
  }, [initialData])

  const handleChange = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }))
  }

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }))
    setErrors(validate(values))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    const allTouched = {}
    Object.keys(errs).forEach((k) => { allTouched[k] = true })
    setTouched(allTouched)
    if (Object.keys(errs).length === 0) {
      onSubmit({
        // teamName is set to participant's name for PaymentStep display
        teamName:       values.name,
        leaderName:     values.name,
        leaderPhone:    values.phone,
        leaderEmail:    values.email,
        members:        [],
        individualData: { ...values },
      })
    }
  }

  const fieldError = (field) => touched[field] && errors[field]

  return (
    <form className="reg-form" onSubmit={handleSubmit} noValidate>
      <h3 className="reg-step-title">Your Details</h3>
      <p className="reg-step-sub">
        Illuminate Workshop is an individual event (₹{config.entryFee} per person).
        Fill in your details to proceed to payment.
      </p>

      <fieldset className="reg-fieldset">
        <legend className="reg-legend">Personal Information</legend>

        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="ind-name">Full Name <span aria-hidden="true">*</span></label>
          <input
            id="ind-name"
            type="text"
            autoComplete="name"
            placeholder="As on your ID card"
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            aria-invalid={!!fieldError('name')}
          />
          {fieldError('name') && <span className="reg-error" role="alert">{errors.name}</span>}
        </div>

        {/* Phone */}
        <div className="form-group">
          <label htmlFor="ind-phone">Phone Number <span aria-hidden="true">*</span></label>
          <input
            id="ind-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={values.phone}
            onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
            onBlur={() => handleBlur('phone')}
            aria-invalid={!!fieldError('phone')}
          />
          {fieldError('phone') && <span className="reg-error" role="alert">{errors.phone}</span>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="ind-email">Email Address <span aria-hidden="true">*</span></label>
          <input
            id="ind-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            aria-invalid={!!fieldError('email')}
          />
          {fieldError('email') && <span className="reg-error" role="alert">{errors.email}</span>}
        </div>
      </fieldset>

      <fieldset className="reg-fieldset">
        <legend className="reg-legend">Academic Information</legend>

        {/* College */}
        <div className="form-group">
          <label htmlFor="ind-college">College / Institution <span aria-hidden="true">*</span></label>
          <input
            id="ind-college"
            type="text"
            placeholder="Your college or university name"
            value={values.college}
            onChange={(e) => handleChange('college', e.target.value)}
            onBlur={() => handleBlur('college')}
            aria-invalid={!!fieldError('college')}
          />
          {fieldError('college') && <span className="reg-error" role="alert">{errors.college}</span>}
        </div>

        {/* Year */}
        <div className="form-group">
          <label htmlFor="ind-year">Year of Study <span aria-hidden="true">*</span></label>
          <select
            id="ind-year"
            value={values.year}
            onChange={(e) => handleChange('year', e.target.value)}
            onBlur={() => handleBlur('year')}
            aria-invalid={!!fieldError('year')}
            style={{ width: '100%' }}
          >
            <option value="">Select year…</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {fieldError('year') && <span className="reg-error" role="alert">{errors.year}</span>}
        </div>

        {/* Department */}
        <div className="form-group">
          <label htmlFor="ind-department">Department / Branch <span aria-hidden="true">*</span></label>
          <input
            id="ind-department"
            type="text"
            placeholder="e.g. Computer Science, MBA, Mechanical"
            value={values.department}
            onChange={(e) => handleChange('department', e.target.value)}
            onBlur={() => handleBlur('department')}
            aria-invalid={!!fieldError('department')}
          />
          {fieldError('department') && <span className="reg-error" role="alert">{errors.department}</span>}
        </div>

        {/* Address */}
        <div className="form-group">
          <label htmlFor="ind-address">Address <span aria-hidden="true">*</span></label>
          <input
            id="ind-address"
            type="text"
            placeholder="City, State"
            value={values.address}
            onChange={(e) => handleChange('address', e.target.value)}
            onBlur={() => handleBlur('address')}
            aria-invalid={!!fieldError('address')}
          />
          {fieldError('address') && <span className="reg-error" role="alert">{errors.address}</span>}
        </div>
      </fieldset>

      <button
        type="submit"
        className="btn btn-primary reg-submit"
        id="individual-details-next"
      >
        Continue to Payment →
      </button>
    </form>
  )
}
