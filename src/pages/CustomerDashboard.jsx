import CustomerServiceHistory from './CustomerServiceHistory'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ServiceHistory from './ServiceHistory'
import PhotoGallery from './PhotoGallery'
import PDFReport from './PDFReport'

export default function CustomerDashboard() {
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    loadVehicles()
  }, [])

  async function loadVehicles() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('email', user.email)

    if (error) {
      console.error(error)
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
  }}
>
 <div>
  <h1 style={{ margin: 0 }}>
    DZ Services
  </h1>

  <h3
    style={{
      marginTop: '10px',
      marginBottom: 0,
      fontWeight: 'normal',
      color: '#666',
    }}
  >
    Customer Portal
  </h3>
</div>

<button
  onClick={async () => {
    await supabase.auth.signOut()
  }}
>
  Logout
</button>
</div>

      {vehicles.length === 0 ? (
        <p>No vehicles found.</p>
      ) : (
        vehicles.map((vehicle) => (
          <div
            key={vehicle.registration}
            style={{
              border: '1px solid #ccc',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '8px',
            }}
          >
            <div
  style={{
    border: '1px solid #ddd',
    padding: '20px',
    borderRadius: '10px',
    backgroundColor: '#f9f9f9',
    marginBottom: '20px',
  }}
>
  <h2>Vehicle Information</h2>

  <p>
    <strong>Registration:</strong> {vehicle.registration}
  </p>

  <p>
    <strong>Vehicle:</strong> {vehicle.make} {vehicle.model}
  </p>

  <p>
    <strong>Year:</strong> {vehicle.year}
  </p>

  <div style={{ marginTop: '20px' }}>
    <PDFReport vehicle={vehicle} />
  </div>
</div>
            
            <hr />

<CustomerServiceHistory
  vehicle={vehicle}
/>
<div
  style={{
    border: '1px solid #ddd',
    padding: '20px',
    borderRadius: '10px',
    backgroundColor: '#f9f9f9',
    marginTop: '20px',
  }}
>
  <h2>Vehicle Photos</h2>

  <PhotoGallery vehicle={vehicle} />
</div>
          </div>
        ))
      )}
    </div>
  )
}
<div
  style={{
    textAlign: 'center',
    marginTop: '40px',
    color: '#666',
    fontSize: '14px',
  }}
>
  DZ Services Vehicle Portal
</div>