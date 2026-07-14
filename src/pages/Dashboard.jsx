import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ openVehicleSearch }) {
const [vehicleCount, setVehicleCount] = useState(0)
const [customerCount, setCustomerCount] = useState(0)
const [serviceCount, setServiceCount] = useState(0)

useEffect(() => {
loadStats()
}, [])

async function loadStats() {
  const { count } = await supabase
  .from('vehicles')
  .select('*', { count: 'exact' })

  const { count: customerTotal } = await supabase
  .from('vehicles')
  .select('*', { count: 'exact' })

  const { count: serviceTotal } = await supabase
  .from('service_visits')
  .select('*', { count: 'exact' })

  setVehicleCount(count || 0)
  setCustomerCount(customerTotal || 0)
  setServiceCount(serviceTotal || 0)
}

return (
<div style={{ padding: '30px' }}>
<div
style={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: '40px',
}}
>
<div style={{ width: '100px' }}></div>

    <h1
      style={{
        margin: 0,
        textAlign: 'center',
        fontSize: '52px',
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
      <h1>{vehicleCount}</h1>
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
      <h1>{customerCount}</h1>
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
      <h1>{serviceCount}</h1>
    </div>
  </div>

  <div style={{ textAlign: 'center' }}>
    <button
      onClick={openVehicleSearch}
      style={{
        padding: '12px 24px',
        fontSize: '16px',
        cursor: 'pointer',
      }}
    >
      Open Vehicle Search
    </button>
  </div>
</div>

)
}