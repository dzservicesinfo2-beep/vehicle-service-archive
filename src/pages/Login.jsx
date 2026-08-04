import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] =
    useState(false)
  const [message, setMessage] = useState('')

  async function signIn(event) {
    event.preventDefault()

    setMessage('')

    if (!email || !password) {
      setMessage('Please enter your email and password.')
      return
    }

    setLoading(true)

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
  }

  async function sendPasswordReset() {
    setMessage('')

    if (!email) {
      setMessage(
        'Enter your email address first, then press Forgot Password.'
      )
      return
    }

    setResetLoading(true)

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
         redirectTo:
        'https://vehicle-service-archive-jc9w.vercel.app/reset-password'
        }
      )

    if (error) {
      setMessage(error.message)
      setResetLoading(false)
      return
    }

    setMessage(
      'Password reset email sent. Open the newest email and follow the link.'
    )

    setResetLoading(false)
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>Vehicle Service Archive</h1>

        <p>
          Sign in using your registered email address.
        </p>

        <form onSubmit={signIn}>
          <label htmlFor="login-email">
            Email address
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
            disabled={loading || resetLoading}
            required
          />

          <label htmlFor="login-password">
            Password
          </label>

          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="current-password"
            disabled={loading || resetLoading}
            required
          />

          {message && (
            <div className="login-message">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || resetLoading}
          >
            {loading ? 'Signing In...' : 'Login'}
          </button>

          <button
            type="button"
            className="forgot-password-button"
            onClick={sendPasswordReset}
            disabled={loading || resetLoading}
          >
            {resetLoading
              ? 'Sending Reset Email...'
              : 'Forgot Password?'}
          </button>
        </form>
      </section>
    </main>
  )
}