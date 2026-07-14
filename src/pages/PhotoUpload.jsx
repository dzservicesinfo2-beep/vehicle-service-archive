import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PhotoUpload({ vehicle }) {
  const [uploading, setUploading] = useState(false)

  async function uploadPhoto(event) {
    const file = event.target.files[0]

    if (!file) return

    setUploading(true)

    const fileName = `${vehicle.registration}-${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from('vehicle-photos')
      .upload(fileName, file)

    if (error) {
      alert(error.message)
      setUploading(false)
      return
    }

    alert('Photo uploaded successfully')

    setUploading(false)
  }

  return (
    <div>
      <h2>Photos</h2>

      <input
        type="file"
        accept="image/*"
        onChange={uploadPhoto}
      />

      {uploading && <p>Uploading...</p>}
    </div>
  )
}