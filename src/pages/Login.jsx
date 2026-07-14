import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')

async function signIn() {
const { error } = await supabase.auth.signInWithPassword({
email,
password,
})

if (error) {
  alert(error.message)
  return
}

}

return (
<div style={{ padding: '40px' }}> <h1>Vehicle Service Archive</h1>

  <input
    placeholder="Email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />

  <br /><br />

  <input
    type="password"
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />

  <br /><br />

  <button onClick={signIn}>
    Login
  </button>
</div>

)
}
