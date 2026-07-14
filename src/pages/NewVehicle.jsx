import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewVehicle() {
  const [registration, setRegistration] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')

  async function saveVehicle() {
    const { error } = await supabase
      .from('vehicles')
      .insert([
        {
          registration,
          customer_name: customerName,
          email,
          phone,
          make,
          model,
          year,
        },
      ])

    if (error) {
      alert(error.message)
      return
    }

    alert('Vehicle Added')

    setRegistration('')
    setCustomerName('')
    setEmail('')
    setPhone('')
    setMake('')
    setModel('')
    setYear('')
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Add Vehicle</h1>

      <input
        placeholder="Registration"
        value={registration}
        onChange={(e) =>
          setRegistration(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Customer Name"
        value={customerName}
        onChange={(e) =>
          setCustomerName(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) =>
          setPhone(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Make"
        value={make}
        onChange={(e) =>
          setMake(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Model"
        value={model}
        onChange={(e) =>
          setModel(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Year"
        value={year}
        onChange={(e) =>
          setYear(e.target.value)
        }
      />

      <br /><br />

      <button onClick={saveVehicle}>
        Save Vehicle
      </button>
    </div>
  )
}