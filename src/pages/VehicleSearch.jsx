import { useState } from 'react'
import { supabase } from '../lib/supabase'
import VehicleProfile from './VehicleProfile'

export default function VehicleSearch({ backToDashboard }) {
  const [registration, setRegistration] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  async function searchVehicles() {
    const searchText = registration.trim()

    if (!searchText) {
      setVehicles([])
      setSelectedVehicle(null)
      setHasSearched(false)
      return
    }

    setSearching(true)
    setSelectedVehicle(null)

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .or(
        `registration.ilike.%${searchText}%,customer_name.ilike.%${searchText}%,phone.ilike.%${searchText}%,make.ilike.%${searchText}%,model.ilike.%${searchText}%`
      )
      .order('registration', { ascending: true })

    setSearching(false)
    setHasSearched(true)

    if (error) {
      alert(error.message)
      return
    }

    setVehicles(data || [])
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
        (vehicle) =>
          vehicle.registration !== deletedRegistration
      )
    )

    setSelectedVehicle(null)
  }

  function clearSearch() {
    setRegistration('')
    setVehicles([])
    setSelectedVehicle(null)
    setHasSearched(false)
  }

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '25px',
        }}
      >
        <button
          type="button"
          onClick={backToDashboard}
          style={{
            padding: '10px 16px',
            cursor: 'pointer',
          }}
        >
          Back to Dashboard
        </button>

        <h1
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: '42px',
          }}
        >
          Vehicle Service Archive
        </h1>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: '10px 16px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {selectedVehicle ? (
        <div>
          <button
            type="button"
            onClick={() => setSelectedVehicle(null)}
            style={{
              padding: '10px 16px',
              marginBottom: '20px',
              cursor: 'pointer',
            }}
          >
            Back to Search Results
          </button>

          <VehicleProfile
  vehicle={selectedVehicle}
  onVehicleDeleted={handleVehicleDeleted}
  onVehicleUpdated={(updatedVehicle) => {
    setSelectedVehicle(updatedVehicle)

    setVehicles((currentVehicles) =>
      currentVehicles.map((vehicle) =>
        vehicle.registration === updatedVehicle.registration
          ? updatedVehicle
          : vehicle
      )
    )
  }}
/>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '25px',
            }}
          >
            <input
              type="text"
              placeholder="Search Registration, Customer, Phone, Make or Model"
              value={registration}
              onChange={(event) =>
                setRegistration(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  searchVehicles()
                }
              }}
              style={{
                padding: '12px',
                width: '500px',
                maxWidth: '100%',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />

            <button
              type="button"
              onClick={searchVehicles}
              disabled={searching}
              style={{
                padding: '12px 22px',
                cursor: searching
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>

            <button
              type="button"
              onClick={clearSearch}
              disabled={
                searching &&
                !registration &&
                vehicles.length === 0
              }
              style={{
                padding: '12px 22px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>

          {searching && <p>Searching for vehicles...</p>}

          {!searching &&
            hasSearched &&
            vehicles.length === 0 && (
              <p>No matching vehicles were found.</p>
            )}

          {!searching &&
            vehicles.map((vehicle) => (
              <div
                key={
                  vehicle.id ||
                  vehicle.registration
                }
                style={{
                  border: '1px solid #ccc',
                  padding: '16px',
                  marginBottom: '12px',
                  borderRadius: '8px',
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  {vehicle.registration}
                </h3>

                <p>
                  <strong>Vehicle:</strong>{' '}
                  {vehicle.make} {vehicle.model}
                </p>

                <p>
                  <strong>Customer:</strong>{' '}
                  {vehicle.customer_name}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedVehicle(vehicle)
                  }
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                  }}
                >
                  Open Vehicle
                </button>
              </div>
            ))}
        </>
      )}
    </div>
  )
}