import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import VehicleSearch from './pages/VehicleSearch'
import CustomerDashboard from './pages/CustomerDashboard'
import Dashboard from './pages/Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [showVehicleSearch, setShowVehicleSearch] = useState(false)
useEffect(() => {
async function getCurrentSession() {
const { data } = await supabase.auth.getSession()
setSession(data.session)
}

getCurrentSession()

const {
data: { subscription },
} = supabase.auth.onAuthStateChange(
(_event, session) => {
setSession(session)
}
)

return () => subscription.unsubscribe()
}, [])


if (!session) {
  return <Login />
}

if (session.user.email === 'customer@test.com') {
  return <CustomerDashboard />
}

if (showVehicleSearch) {
  return <VehicleSearch />
}

return (
  <Dashboard
    openVehicleSearch={() => setShowVehicleSearch(true)}
  />
)
}

export default App