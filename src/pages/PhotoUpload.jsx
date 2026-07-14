import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PhotoUpload({
  vehicle,
  onPhotoUploaded,
}) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  async function uploadPhoto(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Select a valid image file.')
      event.target.value = ''
      return
    }

    setUploading(true)

    const safeOriginalName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      '-'
    )

    const fileName = `${vehicle.registration}-${Date.now()}-${safeOriginalName}`

    const { data, error } = await supabase.storage
      .from('vehicle-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    setUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (error) {
      alert(`Photo upload failed: ${error.message}`)
      return
    }

    if (onPhotoUploaded) {
      onPhotoUploaded({
        name: data.path,
      })
    }

    alert('Photo uploaded successfully.')
  }

  return (
    <div>
      <h2>Photos</h2>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={uploadPhoto}
        disabled={uploading}
      />

      {uploading && <p>Uploading photo...</p>}
    </div>
  )
}