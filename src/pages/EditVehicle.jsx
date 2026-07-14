import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function EditVehicle({ vehicle }) {
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

async function saveVehicle() {
console.log(vehicle.registration)

const { data, error } = await supabase
  .from('vehicles')
  .update({
    customer_name: customerName,
    phone,
    email,
    make,
    model,
    year,
    vin,
    notes,
  })
  .eq('registration', vehicle.registration)
  .select()

console.log('DATA:', data)
console.log('ERROR:', error)
console.log(
  'REGISTRATION:',
  vehicle.registration
)

if (error) {
  alert(error.message)
  return
}

alert(
  `Updated registration: ${vehicle.registration}`
)

}

const inputStyle = {
width: '400px',
padding: '10px',
fontSize: '14px',
borderRadius: '6px',
border: '1px solid #ccc',
}

const notesStyle = {
width: '500px',
height: '150px',
padding: '10px',
fontSize: '14px',
borderRadius: '6px',
border: '1px solid #ccc',
}

return ( <div> <h2>Edit Vehicle</h2>

  <input
    placeholder="Customer Name"
    value={customerName}
    onChange={(e) =>
      setCustomerName(e.target.value)
    }
    style={inputStyle}
  />

  <br /><br />

  <input
    placeholder="Phone"
    value={phone}
    onChange={(e) =>
      setPhone(e.target.value)
    }
    style={inputStyle}
  />

  <br /><br />

  <input
    placeholder="Email"
    value={email}
    onChange={(e) =>
      setEmail(e.target.value)
    }
    style={inputStyle}
  />

  <br /><br />

  <input
    placeholder="Make"
    value={make}
    onChange={(e) =>
      setMake(e.target.value)
    }
    style={inputStyle}
  />

  <br /><br />

  <input
    placeholder="Model"
    value={model}
    onChange={(e) =>
      setModel(e.target.value)
    }
    style={inputStyle}
  />

  <br /><br />

  <input
    placeholder="Year"
    value={year}
    onChange={(e) =>
      setYear(e.target.value)
    }
    style={inputStyle}
  />

  <br /><br />

  <input
    placeholder="VIN"
    value={vin}
    onChange={(e) =>
      setVin(e.target.value)
    }
    style={inputStyle}
  />

  <br /><br />

  <textarea
    placeholder="Notes"
    value={notes}
    onChange={(e) =>
      setNotes(e.target.value)
    }
    style={notesStyle}
  />

  <br /><br />

  <button onClick={saveVehicle}>
    Save Changes
  </button>
</div>

)
}
