import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function EditVehicle({
  vehicle,
  onVehicleUpdated,
}) {
  const [customerName, setCustomerName] = useState(
    vehicle.customer_name || ''
  )
  const [phone, setPhone] = useState(
    vehicle.phone || ''
  )
  const [email, setEmail] = useState(
    vehicle.email || ''
  )
  const [notes, setNotes] = useState(
    vehicle.notes || ''
  )
  const [make, setMake] = useState(
    vehicle.make || ''
  )
  const [model, setModel] = useState(
    vehicle.model || ''
  )
  const [year, setYear] = useState(
    vehicle.year || ''
  )
  const [vin, setVin] = useState(
    vehicle.vin || ''
  )
  const [saving, setSaving] = useState(false)

  async function saveVehicle(event) {
    event.preventDefault()

    if (!customerName.trim()) {
      alert('Customer name is required.')
      return
    }

    setSaving(true)

    const updatedValues = {
      customer_name: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      make: make.trim(),
      model: model.trim(),
      year: year ? Number(year) : null,
      vin: vin.trim(),
      notes: notes.trim(),
    }

    const { data, error } = await supabase
      .from('vehicles')
      .update(updatedValues)
      .eq('registration', vehicle.registration)
      .select()
      .single()

    setSaving(false)

    if (error) {
      alert(`Unable to update vehicle: ${error.message}`)
      return
    }

    if (onVehicleUpdated) {
      onVehicleUpdated(data)
    }

    alert(
      `Vehicle ${vehicle.registration} updated successfully.`
    )
  }

  const inputStyle = {
    width: '100%',
    maxWidth: '700px',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
  }

  const notesStyle = {
    ...inputStyle,
    minHeight: '180px',
    resize: 'vertical',
  }

  return (
    <div style={{ marginTop: '30px' }}>
      <h2>Edit Vehicle</h2>

      <form onSubmit={saveVehicle}>
        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>Customer Name</strong>
          </label>

          <br />

          <input
            type="text"
            value={customerName}
            onChange={(event) =>
              setCustomerName(event.target.value)
            }
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>Phone</strong>
          </label>

          <br />

          <input
            type="text"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>Email</strong>
          </label>

          <br />

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>Make</strong>
          </label>

          <br />

          <input
            type="text"
            value={make}
            onChange={(event) =>
              setMake(event.target.value)
            }
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>Model</strong>
          </label>

          <br />

          <input
            type="text"
            value={model}
            onChange={(event) =>
              setModel(event.target.value)
            }
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>Year</strong>
          </label>

          <br />

          <input
            type="number"
            value={year}
            onChange={(event) =>
              setYear(event.target.value)
            }
            style={inputStyle}
            min="1900"
            max="2100"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>VIN</strong>
          </label>

          <br />

          <input
            type="text"
            value={vin}
            onChange={(event) =>
              setVin(event.target.value)
            }
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>
            <strong>Notes</strong>
          </label>

          <br />

          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            style={notesStyle}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}