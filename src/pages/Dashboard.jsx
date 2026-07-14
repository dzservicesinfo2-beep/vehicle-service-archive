import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({
  openVehicleSearch,
  openNewVehicle,
}) {
  const [vehicleCount, setVehicleCount] = useState(0)
  const [customerCount, setCustomerCount] = useState(0)
  const [serviceCount, setServiceCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)

    const {
      count: vehicleTotal,
      error: vehicleError,
    } = await supabase
      .from('vehicles')
      .select('*', {
        count: 'exact',
        head: true,
      })

    const {
      data: customerRows,
      error: customerError,
    } = await supabase
      .from('vehicles')
      .select('customer_name')

    const {
      count: serviceTotal,
      error: serviceError,
    } = await supabase
      .from('service_visits')
      .select('*', {
        count: 'exact',
        head: true,
      })

    if (vehicleError || customerError || serviceError) {
      alert(
        vehicleError?.message ||
          customerError?.message ||
          serviceError?.message
      )

      setLoading(false)
      return
    }

    const uniqueCustomers = new Set(
      (customerRows || [])
        .map((vehicle) =>
          vehicle.customer_name?.trim().toLowerCase()
        )
        .filter(Boolean)
    )

    setVehicleCount(vehicleTotal || 0)
    setCustomerCount(uniqueCustomers.size)
    setServiceCount(serviceTotal || 0)
    setLoading(false)
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
    }
  }

  return (
    <div style={{ padding: '30px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          position: 'relative',
          minHeight: '70px',
          marginBottom: '40px',
        }}
      >
        <h1
          style={{
            margin: 0,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            fontSize: '52px',
            whiteSpace: 'nowrap',
          }}
        >
          Vehicle Service Archive
        </h1>

        <button
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '25px',
          flexWrap: 'wrap',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            width: '250px',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <h2>Total Vehicles</h2>
          <h1>{loading ? '...' : vehicleCount}</h1>
        </div>

        <div
          style={{
            width: '250px',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <h2>Total Customers</h2>
          <h1>{loading ? '...' : customerCount}</h1>
        </div>

        <div
          style={{
            width: '250px',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <h2>Total Service Visits</h2>
          <h1>{loading ? '...' : serviceCount}</h1>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={openVehicleSearch}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Open Vehicle Search
        </button>

        <button
          type="button"
          onClick={openNewVehicle}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Add New Vehicle
        </button>
      </div>
    </div>
  )
}