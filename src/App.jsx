import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import VehicleSearch from './pages/VehicleSearch'
import CustomerDashboard from './pages/CustomerDashboard'
import Dashboard from './pages/Dashboard'
import NewVehicle from './pages/NewVehicle'

function App() {
  const [session, setSession] = useState(null)
  const [employeePage, setEmployeePage] = useState('dashboard')

  useEffect(() => {
    async function getCurrentSession() {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }

    getCurrentSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)

      if (!currentSession) {
        setEmployeePage('dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Login />
  }

  if (session.user.email === 'customer@test.com') {
    return <CustomerDashboard />
  }

  if (employeePage === 'vehicle-search') {
    return (
      <VehicleSearch
        backToDashboard={() => setEmployeePage('dashboard')}
      />
    )
  }

  if (employeePage === 'new-vehicle') {
    return (
      <NewVehicle
        backToDashboard={() => setEmployeePage('dashboard')}
        openVehicleSearch={() =>
          setEmployeePage('vehicle-search')
        }
      />
    )
  }

  return (
    <Dashboard
      openVehicleSearch={() =>
        setEmployeePage('vehicle-search')
      }
      openNewVehicle={() =>
        setEmployeePage('new-vehicle')
      }
    />
  )
}

export default App