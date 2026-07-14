import { useState } from 'react'
import { supabase } from '../lib/supabase'
import VehicleProfile from './VehicleProfile'

export default function VehicleSearch() {
const [registration, setRegistration] = useState('')
const [vehicles, setVehicles] = useState([])
const [selectedVehicle, setSelectedVehicle] = useState(null)

async function searchVehicles() {
const { data, error } = await supabase
.from('vehicles')
.select('*')
.or(
  `registration.ilike.%${registration}%,customer_name.ilike.%${registration}%,phone.ilike.%${registration}%,make.ilike.%${registration}%,model.ilike.%${registration}%`
)

if (error) {
  alert(error.message)
  return
}

setVehicles(data || [])
}

return (
<div style={{ padding: '20px' }}>

 <div
 style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  position: 'relative',
}}

>
  <h1
  style={{
    margin: 0,
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '42px',
    whiteSpace: 'nowrap',
  }}
>
  Vehicle Service Archive
</h1>

<button
onClick={async () => {
await supabase.auth.signOut()
}}

>

Logout

  </button>
</div>


  <input
    placeholder="Search Registration, Customer, Phone, Make or Model"
    value={registration}
    onChange={(e) => setRegistration(e.target.value)}
  />

  <button
    style={{
  marginLeft: '10px',
  padding: '10px 20px',
}}
    onClick={searchVehicles}
  >
    Search
  </button>

  <hr />

  {vehicles.map((vehicle) => (
    <div
      key={vehicle.registration}
      style={{
        border: '1px solid #ccc',
        padding: '10px',
        marginBottom: '10px',
        borderRadius: '8px',
      }}
    >
      <h3>{vehicle.registration}</h3>

      <p>
        {vehicle.make} {vehicle.model}
      </p>

      <p>{vehicle.customer_name}</p>

      <button
        onClick={() => setSelectedVehicle(vehicle)}
      >
        Open Vehicle
      </button>
    </div>
  ))}

  <hr />

  <VehicleProfile
  vehicle={selectedVehicle}
  onVehicleDeleted={(deletedRegistration) => {
    setVehicles((currentVehicles) =>
      currentVehicles.filter(
        (vehicle) =>
          vehicle.registration !== deletedRegistration
      )
    )

    setSelectedVehicle(null)
  }}
/>