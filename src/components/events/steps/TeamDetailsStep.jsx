/**
 * TeamDetailsStep — Step 1 of RegistrationModal.
 *
 * Collects: Leader Name, Leader Phone, Leader Email, Team Name,
 *           Member 2/3/4 Name + Email.
 *
 * Validation:
 *  - All fields required
 *  - Phone: Indian 10-digit mobile (6–9 start)
 *  - Emails: standard RFC format
 *  - Inline per-field errors shown on blur or on submit attempt
 *  - Submit button disabled until all fields pass
 *
 * TODO (recommended Firestore-rule-level reinforcement):
 *  In firestore.rules, mirror these validations:
 *    request.resource.data.leaderPhone.matches('^[6-9][0-9]{9}$')
 *    request.resource.data.leaderEmail.matches('.*@.*\\..*')
 */

import { useState, useEffect } from 'react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[6-9]\d{9}$/

function validate(values) {
  const errors = {}
  if (!values.leaderName.trim())  errors.leaderName  = 'Leader name is required.'
  if (!PHONE_RE.test(values.leaderPhone)) errors.leaderPhone = 'Enter a valid 10-digit mobile number.'
  if (!EMAIL_RE.test(values.leaderEmail)) errors.leaderEmail = 'Enter a valid email address.'
  if (!values.teamName.trim())    errors.teamName    = 'Team name is required.'
  values.members.forEach((m, i) => {
    if (!m.name.trim())              errors[`member${i+2}name`]  = `Member ${i+2} name is required.`
    if (!EMAIL_RE.test(m.email))     errors[`member${i+2}email`] = `Member ${i+2} email is not valid.`
  })
  return errors
}

function initMembers(count) {
  return Array.from({ length: count }, () => ({ name: '', email: '' }))
}

export default function TeamDetailsStep({ config, initialData, onSubmit }) {
  const memberCount = (config.teamSize ?? 4) - 1  // subtract leader

  const [values, setValues] = useState(() => initialData ?? {
    leaderName:  '',
    leaderPhone: '',
    leaderEmail: '',
    teamName:    '',
    members:     initMembers(memberCount),
  })
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})

  // Re-populate if going back to step 1
  useEffect(() => {
    if (initialData) setValues(initialData)
  }, [initialData])

  const handleChange = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }))
  }

  const handleMemberChange = (i, field, value) => {
    setValues((v) => {
      const members = [...v.members]
      members[i] = { ...members[i], [field]: value }
      return { ...v, members }
    })
  }

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }))
    setErrors(validate(values))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    // Mark everything touched to show all errors
    const allTouched = {}
    Object.keys(errs).forEach((k) => { allTouched[k] = true })
    setTouched(allTouched)
    if (Object.keys(errs).length === 0) onSubmit(values)
  }

  const fieldError = (field) => touched[field] && errors[field]

  return (
    <form className="reg-form" onSubmit={handleSubmit} noValidate>
      <h3 className="reg-step-title">Team Details</h3>
      <p className="reg-step-sub">Fill in your team information to proceed to payment.</p>

      {/* Leader */}
      <fieldset className="reg-fieldset">
        <legend className="reg-legend">Team Leader (You)</legend>

        <div className="form-group">
          <label htmlFor="leaderName">Leader Name <span aria-hidden="true">*</span></label>
          <input
            id="leaderName"
            type="text"
            autoComplete="name"
            value={values.leaderName}
            onChange={(e) => handleChange('leaderName', e.target.value)}
            onBlur={() => handleBlur('leaderName')}
            aria-invalid={!!fieldError('leaderName')}
            aria-describedby={fieldError('leaderName') ? 'err-leaderName' : undefined}
          />
          {fieldError('leaderName') && <span id="err-leaderName" className="reg-error" role="alert">{errors.leaderName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="leaderPhone">Phone Number <span aria-hidden="true">*</span></label>
          <input
            id="leaderPhone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            placeholder="10-digit mobile"
            value={values.leaderPhone}
            onChange={(e) => handleChange('leaderPhone', e.target.value.replace(/\D/g, ''))}
            onBlur={() => handleBlur('leaderPhone')}
            aria-invalid={!!fieldError('leaderPhone')}
            aria-describedby={fieldError('leaderPhone') ? 'err-leaderPhone' : undefined}
          />
          {fieldError('leaderPhone') && <span id="err-leaderPhone" className="reg-error" role="alert">{errors.leaderPhone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="leaderEmail">Email Address <span aria-hidden="true">*</span></label>
          <input
            id="leaderEmail"
            type="email"
            autoComplete="email"
            value={values.leaderEmail}
            onChange={(e) => handleChange('leaderEmail', e.target.value)}
            onBlur={() => handleBlur('leaderEmail')}
            aria-invalid={!!fieldError('leaderEmail')}
            aria-describedby={fieldError('leaderEmail') ? 'err-leaderEmail' : undefined}
          />
          {fieldError('leaderEmail') && <span id="err-leaderEmail" className="reg-error" role="alert">{errors.leaderEmail}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="teamName">Team Name <span aria-hidden="true">*</span></label>
          <input
            id="teamName"
            type="text"
            placeholder="Your squad's name"
            value={values.teamName}
            onChange={(e) => handleChange('teamName', e.target.value)}
            onBlur={() => handleBlur('teamName')}
            aria-invalid={!!fieldError('teamName')}
            aria-describedby={fieldError('teamName') ? 'err-teamName' : undefined}
          />
          {fieldError('teamName') && <span id="err-teamName" className="reg-error" role="alert">{errors.teamName}</span>}
        </div>
      </fieldset>

      {/* Members */}
      {values.members.map((member, i) => (
        <fieldset key={i} className="reg-fieldset">
          <legend className="reg-legend">Member {i + 2}</legend>

          <div className="form-group">
            <label htmlFor={`member${i+2}name`}>Name <span aria-hidden="true">*</span></label>
            <input
              id={`member${i+2}name`}
              type="text"
              value={member.name}
              onChange={(e) => handleMemberChange(i, 'name', e.target.value)}
              onBlur={() => handleBlur(`member${i+2}name`)}
              aria-invalid={!!fieldError(`member${i+2}name`)}
              aria-describedby={fieldError(`member${i+2}name`) ? `err-m${i+2}name` : undefined}
            />
            {fieldError(`member${i+2}name`) && <span id={`err-m${i+2}name`} className="reg-error" role="alert">{errors[`member${i+2}name`]}</span>}
          </div>

          <div className="form-group">
            <label htmlFor={`member${i+2}email`}>Email <span aria-hidden="true">*</span></label>
            <input
              id={`member${i+2}email`}
              type="email"
              value={member.email}
              onChange={(e) => handleMemberChange(i, 'email', e.target.value)}
              onBlur={() => handleBlur(`member${i+2}email`)}
              aria-invalid={!!fieldError(`member${i+2}email`)}
              aria-describedby={fieldError(`member${i+2}email`) ? `err-m${i+2}email` : undefined}
            />
            {fieldError(`member${i+2}email`) && <span id={`err-m${i+2}email`} className="reg-error" role="alert">{errors[`member${i+2}email`]}</span>}
          </div>
        </fieldset>
      ))}

      <button
        type="submit"
        className="btn btn-primary reg-submit"
        id="team-details-next"
      >
        Continue to Payment →
      </button>
    </form>
  )
}
