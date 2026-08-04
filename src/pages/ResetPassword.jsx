import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [checkingSession, setCheckingSession] =
    useState(true)

  const [validSession, setValidSession] =
    useState(false)

  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    let active = true

    async function checkRecoverySession() {
      setCheckingSession(true)
      setErrorMessage('')

      /*
       * Supabase reads the recovery credentials from the
       * URL and stores the resulting session.
       */
      const { data, error } =
        await supabase.auth.getSession()

      if (!active) return

      if (error || !data.session) {
        setValidSession(false)
        setErrorMessage(
          'This password reset link is invalid or has expired. Please request a new password reset email.'
        )
        setCheckingSession(false)
        return
      }

      setValidSession(true)
      setCheckingSession(false)
    }

    checkRecoverySession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return

        if (
          event === 'PASSWORD_RECOVERY' &&
          session
        ) {
          setValidSession(true)
          setErrorMessage('')
          setCheckingSession(false)
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    setErrorMessage('')

    if (!validSession) {
      setErrorMessage(
        'This password reset session is no longer valid. Please request a new password reset email.'
      )
      return
    }

    if (password.length < 8) {
      setErrorMessage(
        'The password must contain at least 8 characters.'
      )
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        'The passwords do not match.'
      )
      return
    }

    setSaving(true)

    const { error } =
      await supabase.auth.updateUser({
        password,
      })

    if (error) {
      setErrorMessage(
        error.message ||
          'The password could not be updated.'
      )
      setSaving(false)
      return
    }

    setCompleted(true)
    setPassword('')
    setConfirmPassword('')
    setSaving(false)
  }

  async function returnToLogin() {
    await supabase.auth.signOut()

    window.history.replaceState(
      {},
      document.title,
      '/'
    )

    window.location.href = '/'
  }

  if (checkingSession) {
    return (
      <main className="login-page">
        <section className="login-card password-reset-card">
          <h1>Checking Reset Link</h1>

          <p>
            Please wait while your password reset link is
            verified.
          </p>
        </section>
      </main>
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
            Your new password has been saved successfully.
          </p>

          <button
            type="button"
            className="password-reset-primary"
            onClick={returnToLogin}
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
          Secure password recovery
        </div>

        <h1>Create New Password</h1>

        <p className="password-reset-intro">
          Enter and confirm the new password for your
          account.
        </p>

        {!validSession ? (
          <>
            <div
              className="password-reset-error"
              role="alert"
            >
              {errorMessage}
            </div>

            <button
              type="button"
              className="password-reset-primary"
              onClick={returnToLogin}
            >
              Return to Login
            </button>
          </>
        ) : (
          <form
            className="password-reset-form"
            onSubmit={handleSubmit}
          >
            <label htmlFor="new-password">
              New password
            </label>

            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
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
                setConfirmPassword(
                  event.target.value
                )
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
        )}
      </section>
    </main>
  )
}

export default ResetPassword