import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

import Login from './pages/Login'
import VehicleSearch from './pages/VehicleSearch'
import CustomerDashboard from './pages/CustomerDashboard'
import Dashboard from './pages/Dashboard'
import NewVehicle from './pages/NewVehicle'

function PasswordRecovery({
  recoverySession,
  onRecoveryFinished,
}) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [completed, setCompleted] = useState(false)

  async function handlePasswordUpdate(event) {
    event.preventDefault()

    setMessage('')
    setErrorMessage('')

    if (!recoverySession) {
      setErrorMessage(
        'The password reset session is missing or has expired. Please request a new password reset email.'
      )
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage(
        'Your new password must contain at least 8 characters.'
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        'The two passwords do not match.'
      )
      return
    }

    setSaving(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setErrorMessage(error.message)
      setSaving(false)
      return
    }

    await supabase.auth.signOut()

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    )

    setNewPassword('')
    setConfirmPassword('')
    setCompleted(true)
    setSaving(false)
    setMessage(
      'Your password has been updated successfully.'
    )
  }

  if (completed) {
    return (
      <main className="login-page">
        <section className="login-card password-reset-card">
          <div className="password-reset-badge">
            Password updated
          </div>

          <h1>Password Reset Complete</h1>

          <p className="password-reset-intro">
            Your new password has been saved. You can now
            sign in using the new password.
          </p>

          {message && (
            <div className="password-reset-success">
              {message}
            </div>
          )}

          <button
            type="button"
            className="password-reset-primary"
            onClick={onRecoveryFinished}
          >
            Return to Login
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="login-page">
      <section className="login-card password-reset-card">
        <div className="password-reset-badge">
          Secure account recovery
        </div>

        <h1>Create New Password</h1>

        <p className="password-reset-intro">
          Enter a new password for your Vehicle Service
          Archive account.
        </p>

        <form
          className="password-reset-form"
          onSubmit={handlePasswordUpdate}
        >
          <label htmlFor="new-password">
            New password
          </label>

          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(event.target.value)
            }
            placeholder="Enter at least 8 characters"
            autoComplete="new-password"
            disabled={saving}
            required
          />

          <label htmlFor="confirm-password">
            Confirm new password
          </label>

          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            placeholder="Enter the password again"
            autoComplete="new-password"
            disabled={saving}
            required
          />

          {errorMessage && (
            <div
              className="password-reset-error"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="password-reset-primary"
            disabled={saving}
          >
            {saving
              ? 'Updating Password...'
              : 'Update Password'}
          </button>
        </form>
      </section>
    </main>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] =
    useState(true)

  const [passwordRecovery, setPasswordRecovery] =
    useState(false)

  const [recoverySession, setRecoverySession] =
    useState(null)

  const [employeePage, setEmployeePage] =
    useState('dashboard')

  useEffect(() => {
    let active = true

    async function loadProfile(authUserId) {
      if (!active) return

      setLoadingProfile(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .eq('active', true)
        .single()

      if (!active) return

      if (error) {
        setProfile(null)
        setLoadingProfile(false)
        return
      }

      setProfile(data)
      setLoadingProfile(false)
    }

    const recoveryLinkDetected =
      window.location.hash.includes(
        'type=recovery'
      ) ||
      window.location.search.includes(
        'type=recovery'
      )

    if (recoveryLinkDetected) {
      setPasswordRecovery(true)
      setLoadingProfile(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!active) return

        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecovery(true)
          setRecoverySession(currentSession)
          setSession(currentSession)
          setProfile(null)
          setLoadingProfile(false)
          return
        }

        setSession(currentSession)

        if (!currentSession) {
          setProfile(null)
          setEmployeePage('dashboard')
          setLoadingProfile(false)
          return
        }

        if (!passwordRecovery) {
          setTimeout(() => {
            loadProfile(currentSession.user.id)
          }, 0)
        }
      }
    )

    async function loadSessionAndProfile() {
      const { data } =
        await supabase.auth.getSession()

      if (!active) return

      const currentSession = data.session

      setSession(currentSession)

      if (recoveryLinkDetected) {
        setRecoverySession(currentSession)
        setLoadingProfile(false)
        return
      }

      if (!currentSession) {
        setProfile(null)
        setLoadingProfile(false)
        return
      }

      await loadProfile(currentSession.user.id)
    }

    loadSessionAndProfile()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  if (passwordRecovery) {
    return (
      <PasswordRecovery
        recoverySession={recoverySession || session}
        onRecoveryFinished={() => {
          setPasswordRecovery(false)
          setRecoverySession(null)
          setSession(null)
          setProfile(null)
          setLoadingProfile(false)

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          )
        }}
      />
    )
  }

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