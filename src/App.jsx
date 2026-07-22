import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

import Login from './pages/Login'
import VehicleSearch from './pages/VehicleSearch'
import CustomerDashboard from './pages/CustomerDashboard'
import Dashboard from './pages/Dashboard'
import NewVehicle from './pages/NewVehicle'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] =
    useState(true)

  const [employeePage, setEmployeePage] =
    useState('dashboard')

  useEffect(() => {
    async function loadProfile(authUserId) {
      setLoadingProfile(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .eq('active', true)
        .single()

      if (error) {
        setProfile(null)
        setLoadingProfile(false)
        return
      }

      setProfile(data)
      setLoadingProfile(false)
    }

    async function loadSessionAndProfile() {
      const { data } =
        await supabase.auth.getSession()

      const currentSession = data.session

      setSession(currentSession)

      if (!currentSession) {
        setProfile(null)
        setLoadingProfile(false)
        return
      }

      await loadProfile(currentSession.user.id)
    }

    loadSessionAndProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession)

        if (!currentSession) {
          setProfile(null)
          setEmployeePage('dashboard')
          setLoadingProfile(false)
          return
        }

        await loadProfile(currentSession.user.id)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (!session) {
    return <Login />
  }

  if (loadingProfile) {
    return (
      <main className="login-page">
        <div className="login-card">
          <p>Loading account...</p>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="login-page">
        <div className="login-card">
          <h1>Access Denied</h1>

          <p>
            This account does not have an active Vehicle
            Service Archive profile.
          </p>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut()
            }}
          >
            Logout
          </button>
        </div>
      </main>
    )
  }

  if (profile.role === 'customer') {
    return <CustomerDashboard />
  }

  if (
    profile.role !== 'admin' &&
    profile.role !== 'employee'
  ) {
    return (
      <main className="login-page">
        <div className="login-card">
          <h1>Access Denied</h1>

          <p>This account role is not permitted.</p>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut()
            }}
          >
            Logout
          </button>
        </div>
      </main>
    )
  }

  if (employeePage === 'vehicle-search') {
    return (
      <VehicleSearch
        backToDashboard={() =>
          setEmployeePage('dashboard')
        }
      />
    )
  }

  if (employeePage === 'new-vehicle') {
    return (
      <NewVehicle
        backToDashboard={() =>
          setEmployeePage('dashboard')
        }
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