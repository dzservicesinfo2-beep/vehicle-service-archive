import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function createFormFromVehicle(vehicle) {
  return {
    customerName: vehicle.customer_name || '',
    phone: vehicle.phone || '',
    email: vehicle.email || '',
    make: vehicle.make || '',
    model: vehicle.model || '',
    year: vehicle.year || '',
    vin: vehicle.vin || '',
    notes: vehicle.notes || '',
  }
}

export default function EditVehicle({
  vehicle,
  onVehicleUpdated,
}) {
  const [form, setForm] = useState(() =>
    createFormFromVehicle(vehicle)
  )
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] =
    useState('')

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    setForm(createFormFromVehicle(vehicle))
    setFormError('')
    setSuccessMessage('')
  }, [vehicle])

  const hasChanges = useMemo(() => {
    const originalForm = createFormFromVehicle(vehicle)

    return Object.keys(originalForm).some(
      (field) =>
        String(form[field] ?? '').trim() !==
        String(originalForm[field] ?? '').trim()
    )
  }, [form, vehicle])

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
      setSuccessMessage('')
      return
    }

    if (!hasChanges) {
      setFormError(
        'No changes have been made to this vehicle record.'
      )
      setSuccessMessage('')
      return
    }

    setSaving(true)
    setFormError('')
    setSuccessMessage('')

    const updatedValues = {
      customer_name: form.customerName.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      make: form.make.trim() || null,
      model: form.model.trim() || null,
      year: form.year ? Number(form.year) : null,
      vin: form.vin.trim().toUpperCase() || null,
      notes: form.notes.trim() || null,
    }

    const { data, error } = await supabase
      .from('vehicles')
      .update(updatedValues)
      .eq('registration', vehicle.registration)
      .select()
      .single()

    setSaving(false)

    if (error) {
      setFormError(
        `The vehicle could not be updated: ${error.message}`
      )
      return
    }

    setForm(createFormFromVehicle(data))
    setSuccessMessage(
      `${vehicle.registration} was updated successfully.`
    )

    if (onVehicleUpdated) {
      onVehicleUpdated(data)
    }
  }

  function resetChanges() {
    setForm(createFormFromVehicle(vehicle))
    setFormError('')
    setSuccessMessage('')
  }

  return (
    <section className="edit-vehicle-panel">
      <div className="edit-vehicle-heading">
        <div>
          <span className="edit-vehicle-eyebrow">
            Vehicle Record
          </span>

          <h2>Edit Vehicle Details</h2>

          <p>
            Update the customer, vehicle and workshop
            information stored for this record.
          </p>
        </div>

        <div className="edit-vehicle-registration">
          <span>Registration</span>
          <strong>{vehicle.registration}</strong>
          <small>Registration is locked</small>
        </div>
      </div>

      {formError && (
        <div
          className="edit-vehicle-message edit-vehicle-error"
          role="alert"
        >
          <div className="edit-vehicle-message-icon">
            !
          </div>

          <div>
            <strong>Changes not saved</strong>
            <p>{formError}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div
          className="edit-vehicle-message edit-vehicle-success"
          role="status"
        >
          <div className="edit-vehicle-message-icon">
            ✓
          </div>

          <div>
            <strong>Vehicle updated</strong>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      <form
        className="edit-vehicle-form"
        onSubmit={saveVehicle}
        noValidate
      >
        <section className="edit-vehicle-form-section">
          <div className="edit-vehicle-section-heading">
            <div className="edit-vehicle-section-number">
              1
            </div>

            <div>
              <h3>Customer Information</h3>
              <p>
                Update the customer or company connected
                to this vehicle.
              </p>
            </div>
          </div>

          <div className="edit-vehicle-form-grid">
            <div className="edit-vehicle-field edit-vehicle-field-full">
              <label htmlFor="edit-customer-name">
                Customer or Company Name
                <span className="edit-vehicle-required">
                  *
                </span>
              </label>

              <input
                id="edit-customer-name"
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

            <div className="edit-vehicle-field">
              <label htmlFor="edit-customer-phone">
                Phone Number
              </label>

              <input
                id="edit-customer-phone"
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

            <div className="edit-vehicle-field">
              <label htmlFor="edit-customer-email">
                Email Address
              </label>

              <input
                id="edit-customer-email"
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

        <section className="edit-vehicle-form-section">
          <div className="edit-vehicle-section-heading">
            <div className="edit-vehicle-section-number">
              2
            </div>

            <div>
              <h3>Vehicle Information</h3>
              <p>
                Maintain the identifying details of the
                vehicle.
              </p>
            </div>
          </div>

          <div className="edit-vehicle-form-grid">
            <div className="edit-vehicle-field">
              <label htmlFor="edit-vehicle-make">
                Make
              </label>

              <input
                id="edit-vehicle-make"
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

            <div className="edit-vehicle-field">
              <label htmlFor="edit-vehicle-model">
                Model
              </label>

              <input
                id="edit-vehicle-model"
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

            <div className="edit-vehicle-field">
              <label htmlFor="edit-vehicle-year">
                Year
              </label>

              <input
                id="edit-vehicle-year"
                type="number"
                inputMode="numeric"
                min="1900"
                max={currentYear + 1}
                placeholder={String(currentYear)}
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

            <div className="edit-vehicle-field">
              <label htmlFor="edit-registration">
                Registration
              </label>

              <input
                id="edit-registration"
                className="edit-vehicle-locked-input"
                type="text"
                value={vehicle.registration}
                disabled
              />

              <small>
                Registration cannot be changed from this
                form.
              </small>
            </div>

            <div className="edit-vehicle-field edit-vehicle-field-full">
              <label htmlFor="edit-vehicle-vin">
                Vehicle Identification Number
              </label>

              <input
                id="edit-vehicle-vin"
                className="edit-vehicle-vin-input"
                type="text"
                autoComplete="off"
                spellCheck="false"
                maxLength="17"
                placeholder="17-character VIN"
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

        <section className="edit-vehicle-form-section">
          <div className="edit-vehicle-section-heading">
            <div className="edit-vehicle-section-number">
              3
            </div>

            <div>
              <h3>Workshop Notes</h3>
              <p>
                Store useful information for workshop
                employees.
              </p>
            </div>
          </div>

          <div className="edit-vehicle-field edit-vehicle-field-full">
            <label htmlFor="edit-vehicle-notes">
              Vehicle or Customer Notes
            </label>

            <textarea
              id="edit-vehicle-notes"
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
              These notes appear on the main vehicle
              profile.
            </small>
          </div>
        </section>

        <footer className="edit-vehicle-actions">
          <div className="edit-vehicle-change-status">
            <strong>
              {hasChanges
                ? 'Unsaved changes'
                : 'Vehicle record is up to date'}
            </strong>

            <span>
              {hasChanges
                ? 'Save the form to apply your changes.'
                : 'Make an edit to enable the save button.'}
            </span>
          </div>

          <div className="edit-vehicle-action-buttons">
            <button
              type="button"
              className="secondary-button"
              onClick={resetChanges}
              disabled={saving || !hasChanges}
            >
              Cancel Changes
            </button>

            <button
              type="submit"
              className="edit-vehicle-save-button"
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <>
                  <span className="edit-vehicle-spinner" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </footer>
      </form>
    </section>
  )
}