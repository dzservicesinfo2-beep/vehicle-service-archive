import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CustomerServiceHistory from './CustomerServiceHistory'
import PhotoGallery from './PhotoGallery'
import PDFReport from './PDFReport'

export default function CustomerDashboard() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadVehicles() {
      setLoading(true)
      setErrorMessage('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        setErrorMessage(
          `Unable to load your account: ${userError.message}`
        )
        setLoading(false)
        return
      }

      if (!user) {
        setErrorMessage('No signed-in customer account was found.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('email', user.email)
        .order('registration', { ascending: true })

      if (error) {
        setErrorMessage(
          `Unable to load your vehicles: ${error.message}`
        )
        setLoading(false)
        return
      }

      setVehicles(data || [])
      setLoading(false)
    }

    loadVehicles()
  }, [])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(`Unable to log out: ${error.message}`)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
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
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {loading && <p>Loading your vehicles...</p>}

      {!loading && errorMessage && (
        <p
          style={{
            color: '#b42318',
            fontWeight: 'bold',
          }}
        >
          {errorMessage}
        </p>
      )}

      {!loading &&
        !errorMessage &&
        vehicles.length === 0 && (
          <p>No vehicles found.</p>
        )}

      {!loading &&
        !errorMessage &&
        vehicles.map((vehicle) => (
          <div
            key={vehicle.id || vehicle.registration}
            style={{
              border: '1px solid #ccc',
              padding: '15px',
              marginBottom: '20px',
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
                <strong>Registration:</strong>{' '}
                {vehicle.registration}
              </p>

              <p>
                <strong>Vehicle:</strong>{' '}
                {vehicle.make || 'Not provided'}{' '}
                {vehicle.model || ''}
              </p>

              <p>
                <strong>Year:</strong>{' '}
                {vehicle.year || 'Not provided'}
              </p>

              <div style={{ marginTop: '20px' }}>
                <PDFReport vehicle={vehicle} />
              </div>
            </div>

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
        ))}

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
    </div>
  )
}