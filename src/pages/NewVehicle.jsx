import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewVehicle({
  backToDashboard,
  openVehicleSearch,
}) {
  const [registration, setRegistration] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [vin, setVin] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveVehicle(event) {
    event.preventDefault()

    const cleanRegistration = registration
      .trim()
      .toUpperCase()

    if (!cleanRegistration) {
      alert('Registration is required.')
      return
    }

    if (!customerName.trim()) {
      alert('Customer name is required.')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('vehicles')
      .insert([
        {
          registration: cleanRegistration,
          customer_name: customerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          make: make.trim(),
          model: model.trim(),
          year: year ? Number(year) : null,
          vin: vin.trim(),
          notes: notes.trim(),
        },
      ])

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('Vehicle added successfully.')

    setRegistration('')
    setCustomerName('')
    setEmail('')
    setPhone('')
    setMake('')
    setModel('')
    setYear('')
    setVin('')
    setNotes('')

    openVehicleSearch()
  }

  const inputStyle = {
    width: '100%',
    maxWidth: '700px',
    padding: '12px',
    fontSize: '16px',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '30px' }}>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '25px',
        }}
      >
        <button
          type="button"
          onClick={backToDashboard}
        >
          Back to Dashboard
        </button>

        <button
          type="button"
          onClick={openVehicleSearch}
        >
          Vehicle Search
        </button>
      </div>

      <h1>Add New Vehicle</h1>

      <form onSubmit={saveVehicle}>
        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>Registration</strong>
          </label>

          <br />

          <input
            type="text"
            placeholder="Registration"
            value={registration}
            onChange={(event) =>
              setRegistration(event.target.value)
            }
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>Customer Name</strong>
          </label>

          <br />

          <input
            type="text"
            placeholder="Customer Name"
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
            <strong>Email</strong>
          </label>

          <br />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>
            <strong>Phone</strong>
          </label>

          <br />

          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
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
            placeholder="Make"
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
            placeholder="Model"
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
            placeholder="Year"
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
            placeholder="VIN"
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
            placeholder="Vehicle or customer notes"
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            style={{
              ...inputStyle,
              minHeight: '160px',
              resize: 'vertical',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving Vehicle...' : 'Save Vehicle'}
        </button>
      </form>
    </div>
  )
}