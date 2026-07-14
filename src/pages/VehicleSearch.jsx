import { useState } from 'react'
import { supabase } from '../lib/supabase'
import VehicleProfile from './VehicleProfile'

export default function VehicleSearch() {
  const [registration, setRegistration] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  async function searchVehicles() {
    const searchText = registration.trim()

    if (!searchText) {
      setVehicles([])
      setSelectedVehicle(null)
      return
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .or(
        `registration.ilike.%${searchText}%,customer_name.ilike.%${searchText}%,phone.ilike.%${searchText}%,make.ilike.%${searchText}%,model.ilike.%${searchText}%`
      )

    if (error) {
      alert(error.message)
      return
    }

    setVehicles(data || [])
    setSelectedVehicle(null)
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
    }
  }

  function handleVehicleDeleted(deletedRegistration) {
    setVehicles((currentVehicles) =>
      currentVehicles.filter(
        (vehicle) => vehicle.registration !== deletedRegistration
      )
    )

    setSelectedVehicle(null)
  }

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: '20px',
          position: 'relative',
          minHeight: '55px',
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

        <button onClick={handleLogout}>Logout</button>
      </div>

      <input
        type="text"
        placeholder="Search Registration, Customer, Phone, Make or Model"
        value={registration}
        onChange={(event) => setRegistration(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            searchVehicles()
          }
        }}
        style={{
          padding: '10px',
          width: '420px',
          maxWidth: '100%',
        }}
      />

      <button
        type="button"
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
          key={vehicle.id || vehicle.registration}
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
            type="button"
            onClick={() => setSelectedVehicle(vehicle)}
          >
            Open Vehicle
          </button>
        </div>
      ))}

      <hr />

      {selectedVehicle && (
        <VehicleProfile
          vehicle={selectedVehicle}
          onVehicleDeleted={handleVehicleDeleted}
        />
      )}
    </div>
  )
}