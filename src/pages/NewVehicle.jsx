import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const initialForm = {
  registration: '',
  customerName: '',
  email: '',
  phone: '',
  make: '',
  model: '',
  year: '',
  vin: '',
  notes: '',
}

export default function NewVehicle({
  backToDashboard,
  openVehicleSearch,
}) {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] =
    useState('')

  const currentYear = new Date().getFullYear()

  const registrationPreview = useMemo(() => {
    return formatRegistration(form.registration)
  }, [form.registration])

  function formatRegistration(value) {
    return value
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[^A-Z0-9-]/g, '')
  }

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))

    if (formError) {
      setFormError('')
    }

    if (successMessage) {
      setSuccessMessage('')
    }
  }

  function validateForm() {
    const cleanRegistration = formatRegistration(
      form.registration
    )

    if (!cleanRegistration) {
      return 'Vehicle registration is required.'
    }

    if (cleanRegistration.length < 3) {
      return 'Please enter a valid vehicle registration.'
    }

    if (!form.customerName.trim()) {
      return 'Customer or company name is required.'
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      return 'Please enter a valid email address.'
    }

    if (form.year) {
      const numericYear = Number(form.year)

      if (
        numericYear < 1900 ||
        numericYear > currentYear + 1
      ) {
        return `Vehicle year must be between 1900 and ${
          currentYear + 1
        }.`
      }
    }

    if (
      form.vin.trim() &&
      form.vin.trim().length !== 17
    ) {
      return 'A VIN should contain exactly 17 characters.'
    }

    return ''
  }

  async function saveVehicle(event) {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      return
    }

    const cleanRegistration = formatRegistration(
      form.registration
    )

    setSaving(true)
    setFormError('')
    setSuccessMessage('')

    const { data: existingVehicle, error: checkError } =
      await supabase
        .from('vehicles')
        .select('registration')
        .eq('registration', cleanRegistration)
        .maybeSingle()

    if (checkError) {
      setSaving(false)
      setFormError(
        `Unable to check the registration: ${checkError.message}`
      )
      return
    }

    if (existingVehicle) {
      setSaving(false)
      setFormError(
        `A vehicle with registration ${cleanRegistration} already exists.`
      )
      return
    }

    const { error } = await supabase
      .from('vehicles')
      .insert([
        {
          registration: cleanRegistration,
          customer_name: form.customerName.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          make: form.make.trim() || null,
          model: form.model.trim() || null,
          year: form.year
            ? Number(form.year)
            : null,
          vin:
            form.vin.trim().toUpperCase() || null,
          notes: form.notes.trim() || null,
        },
      ])

    setSaving(false)

    if (error) {
      if (
        error.code === '23505' ||
        error.message
          .toLowerCase()
          .includes('duplicate')
      ) {
        setFormError(
          `A vehicle with registration ${cleanRegistration} already exists.`
        )
        return
      }

      setFormError(
        `The vehicle could not be saved: ${error.message}`
      )
      return
    }

    setForm(initialForm)
    setSuccessMessage(
      `${cleanRegistration} was added successfully.`
    )

    window.setTimeout(() => {
      openVehicleSearch()
    }, 900)
  }

  function clearForm() {
    setForm(initialForm)
    setFormError('')
    setSuccessMessage('')
  }

  return (
    <div className="app new-vehicle-page">
      <header className="app-header">
        <div className="app-header-inner">
          <button
            type="button"
            onClick={backToDashboard}
          >
            Back to Dashboard
          </button>

          <h1 className="app-header-title">
            Vehicle Service Archive
          </h1>

          <div className="app-header-actions">
            <button
              type="button"
              onClick={openVehicleSearch}
            >
              Vehicle Search
            </button>
          </div>
        </div>
      </header>

      <main className="new-vehicle-container">
        <section className="new-vehicle-heading">
          <div>
            <span className="new-vehicle-eyebrow">
              Workshop Intake
            </span>

            <h1>Add New Vehicle</h1>

            <p>
              Create a new customer and vehicle record
              before beginning workshop service work.
            </p>
          </div>

          <div className="new-vehicle-heading-badge">
            New Record
          </div>
        </section>

        {formError && (
          <div
            className="new-vehicle-message new-vehicle-error"
            role="alert"
          >
            <div className="new-vehicle-message-icon">
              !
            </div>

            <div>
              <strong>Vehicle not saved</strong>
              <p>{formError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            className="new-vehicle-message new-vehicle-success"
            role="status"
          >
            <div className="new-vehicle-message-icon">
              ✓
            </div>

            <div>
              <strong>Vehicle added</strong>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        <form
          className="new-vehicle-form"
          onSubmit={saveVehicle}
          noValidate
        >
          <section className="new-vehicle-form-section">
            <div className="new-vehicle-section-heading">
              <div className="new-vehicle-section-number">
                1
              </div>

              <div>
                <h2>Customer Information</h2>

                <p>
                  Enter the customer or company details
                  connected to this vehicle.
                </p>
              </div>
            </div>

            <div className="new-vehicle-form-grid">
              <div className="new-vehicle-field new-vehicle-field-full">
                <label htmlFor="customer-name">
                  Customer or Company Name
                  <span className="new-vehicle-required">
                    *
                  </span>
                </label>

                <input
                  id="customer-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Customer or business name"
                  value={form.customerName}
                  onChange={(event) =>
                    updateField(
                      'customerName',
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              <div className="new-vehicle-field">
                <label htmlFor="customer-phone">
                  Phone Number
                </label>

                <input
                  id="customer-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Example: 087 123 4567"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      'phone',
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              <div className="new-vehicle-field">
                <label htmlFor="customer-email">
                  Email Address
                </label>

                <input
                  id="customer-email"
                  type="email"
                  autoComplete="email"
                  placeholder="customer@example.com"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      'email',
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>
            </div>
          </section>

          <section className="new-vehicle-form-section">
            <div className="new-vehicle-section-heading">
              <div className="new-vehicle-section-number">
                2
              </div>

              <div>
                <h2>Vehicle Information</h2>

                <p>
                  Record the identifying details of the
                  vehicle entering the workshop.
                </p>
              </div>
            </div>

            <div className="new-vehicle-form-grid">
              <div className="new-vehicle-field">
                <label htmlFor="vehicle-registration">
                  Registration
                  <span className="new-vehicle-required">
                    *
                  </span>
                </label>

                <input
                  id="vehicle-registration"
                  className="new-vehicle-registration-input"
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  placeholder="241-D-12345"
                  value={form.registration}
                  onChange={(event) =>
                    updateField(
                      'registration',
                      formatRegistration(
                        event.target.value
                      )
                    )
                  }
                  disabled={saving}
                />

                <small>
                  Registration will be stored as:{' '}
                  <strong>
                    {registrationPreview ||
                      'Not entered'}
                  </strong>
                </small>
              </div>

              <div className="new-vehicle-field">
                <label htmlFor="vehicle-year">
                  Year
                </label>

                <input
                  id="vehicle-year"
                  type="number"
                  inputMode="numeric"
                  placeholder={String(currentYear)}
                  min="1900"
                  max={currentYear + 1}
                  value={form.year}
                  onChange={(event) =>
                    updateField(
                      'year',
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              <div className="new-vehicle-field">
                <label htmlFor="vehicle-make">
                  Make
                </label>

                <input
                  id="vehicle-make"
                  type="text"
                  autoComplete="off"
                  placeholder="Example: Ford"
                  value={form.make}
                  onChange={(event) =>
                    updateField(
                      'make',
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              <div className="new-vehicle-field">
                <label htmlFor="vehicle-model">
                  Model
                </label>

                <input
                  id="vehicle-model"
                  type="text"
                  autoComplete="off"
                  placeholder="Example: Transit"
                  value={form.model}
                  onChange={(event) =>
                    updateField(
                      'model',
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              <div className="new-vehicle-field new-vehicle-field-full">
                <label htmlFor="vehicle-vin">
                  Vehicle Identification Number
                </label>

                <input
                  id="vehicle-vin"
                  className="new-vehicle-vin-input"
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  placeholder="17-character VIN"
                  maxLength="17"
                  value={form.vin}
                  onChange={(event) =>
                    updateField(
                      'vin',
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                    )
                  }
                  disabled={saving}
                />

                <small>
                  {form.vin.length}/17 characters
                </small>
              </div>
            </div>
          </section>

          <section className="new-vehicle-form-section">
            <div className="new-vehicle-section-heading">
              <div className="new-vehicle-section-number">
                3
              </div>

              <div>
                <h2>Workshop Notes</h2>

                <p>
                  Add useful customer, vehicle or fleet
                  information for workshop staff.
                </p>
              </div>
            </div>

            <div className="new-vehicle-field new-vehicle-field-full">
              <label htmlFor="vehicle-notes">
                Vehicle or Customer Notes
              </label>

              <textarea
                id="vehicle-notes"
                placeholder="Add fleet details, customer instructions, recurring issues or other useful information..."
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    'notes',
                    event.target.value
                  )
                }
                disabled={saving}
              />

              <small>
                These notes will appear on the vehicle
                profile.
              </small>
            </div>
          </section>

          <footer className="new-vehicle-form-actions">
            <div>
              <strong>Ready to create the record?</strong>

              <span>
                Required fields are marked with an
                asterisk.
              </span>
            </div>

            <div className="new-vehicle-action-buttons">
              <button
                type="button"
                className="secondary-button"
                onClick={clearForm}
                disabled={saving}
              >
                Clear Form
              </button>

              <button
                type="submit"
                className="new-vehicle-save-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="new-vehicle-spinner" />
                    Saving Vehicle...
                  </>
                ) : (
                  'Save Vehicle'
                )}
              </button>
            </div>
          </footer>
        </form>
      </main>
    </div>
  )
}