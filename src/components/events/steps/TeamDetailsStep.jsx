/**
 * TeamDetailsStep — Step 1 of RegistrationModal.
 *
 * Collects: Leader Name, Leader Phone, Leader Email, Team Name,
 *           Member 2/3/4 Name + Email (OPTIONAL).
 *
 * Validation:
 *  - Leader Name, Leader Phone, Leader Email, Team Name: REQUIRED
 *  - Member 2/3/4 Name + Email: OPTIONAL — form is valid with only leader filled
 *  - If a member field is partially filled (name given but no email, or vice versa),
 *    validate the provided sub-field but do NOT require the other.
 *    This keeps data consistent: either both fields are null or both are meaningful.
 *  - Blank member fields stored as null (not empty string) in team_data jsonb.
 *  - Phone: Indian 10-digit mobile (6–9 start)
 *  - Emails: standard RFC format
 *  - Inline per-field errors shown on blur or on submit attempt
 *
 * Note: This component is shared by ALL multi-member team events (BGMI LEC, FFLEC,
 *       CraftCode, IPL Auction, Startup Pitch, Money Makers) via eventConfigs.js config —
 *       not duplicated per-event.
 */

import { useState, useEffect } from 'react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[6-9]\d{9}$/

/**
 * Validate form values. Members are optional — only validate if any data entered.
 * If name is provided for a member, email must be valid (and vice versa).
 */
function validate(values) {
  const errors = {}
  if (!values.leaderName.trim())  errors.leaderName  = 'Leader name is required.'
  if (!PHONE_RE.test(values.leaderPhone)) errors.leaderPhone = 'Enter a valid 10-digit mobile number.'
  if (!EMAIL_RE.test(values.leaderEmail)) errors.leaderEmail = 'Enter a valid email address.'
  if (!values.teamName.trim())    errors.teamName    = 'Team name is required.'

  values.members.forEach((m, i) => {
    const hasName  = m.name.trim().length > 0
    const hasEmail = m.email.trim().length > 0
    // If either field has content, validate the email (name is free-text so no format check)
    if ((hasName || hasEmail) && !EMAIL_RE.test(m.email)) {
      errors[`member${i+2}email`] = `Member ${i+2} email is not valid.`
    }
    // If email is given but name is blank, require name too
    if (hasEmail && !hasName) {
      errors[`member${i+2}name`] = `Member ${i+2} name is required when email is provided.`
    }
  })
  return errors
}

function initMembers(count) {
  return Array.from({ length: count }, () => ({ name: '', email: '' }))
}

/**
 * Sanitize members for storage: replace any member whose name AND email are both
 * blank with null so downstream code can cleanly distinguish "not provided".
 */
export function sanitizeMembers(members) {
  return members.map((m) => {
    const name  = m.name.trim()
    const email = m.email.trim()
    if (!name && !email) return null
    return { name: name || null, email: email || null }
  })
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
    if (Object.keys(errs).length === 0) {
      // Sanitize members before passing upstream: blank slots → null
      onSubmit({
        ...values,
        members: sanitizeMembers(values.members),
      })
    }
  }

  const fieldError = (field) => touched[field] && errors[field]

  return (
    <form className="reg-form" onSubmit={handleSubmit} noValidate>
      <div className="reg-header-row">
        <div>
          <h3 className="reg-step-title">Team Details</h3>
          <p className="reg-step-sub">Fill in your team information to proceed to payment.</p>
        </div>
        {config.entryFee && (
          <div className="reg-fee-badge-pill" id="team-details-fee-badge" aria-label={`Registration Fee ₹${config.entryFee}`}>
            <span className="fee-pill-label">Registration Fee</span>
            <span className="fee-pill-amount">₹{config.entryFee}</span>
          </div>
        )}
      </div>

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
            <label htmlFor={`member${i+2}name`}>Name</label>
            <input
              id={`member${i+2}name`}
              type="text"
              placeholder="Leave blank if solo / fewer members"
              value={member.name}
              onChange={(e) => handleMemberChange(i, 'name', e.target.value)}
              onBlur={() => handleBlur(`member${i+2}name`)}
              aria-invalid={!!fieldError(`member${i+2}name`)}
              aria-describedby={fieldError(`member${i+2}name`) ? `err-m${i+2}name` : undefined}
            />
            {fieldError(`member${i+2}name`) && <span id={`err-m${i+2}name`} className="reg-error" role="alert">{errors[`member${i+2}name`]}</span>}
          </div>

          <div className="form-group">
            <label htmlFor={`member${i+2}email`}>Email</label>
            <input
              id={`member${i+2}email`}
              type="email"
              placeholder="Leave blank if not applicable"
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

      {config.entryFee && (
        <div className="reg-fee-summary-strip">
          <span>Registration Fee for {config.name}:</span>
          <strong className="accent" style={{ fontSize: '1.15rem' }}>₹{config.entryFee}</strong>
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary reg-submit"
        id="team-details-next"
      >
        Continue to Payment Review (₹{config.entryFee}) →
      </button>
    </form>
  )
}
