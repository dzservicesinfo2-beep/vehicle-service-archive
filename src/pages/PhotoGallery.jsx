import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PhotoGallery({ vehicle }) {
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    loadPhotos()
  }, [vehicle])

  async function loadPhotos() {
    const { data, error } = await supabase.storage
      .from('vehicle-photos')
      .list('', {
        limit: 100,
      })

    if (error) {
      console.error(error)
      return
    }

    const vehiclePhotos = data.filter((photo) =>
      photo.name.startsWith(vehicle.registration)
    )

    setPhotos(vehiclePhotos)
  }

  return (
    <div>
      <h2>Uploaded Photos</h2>

      {photos.map((photo) => {
        const { data } = supabase.storage
          .from('vehicle-photos')
          .getPublicUrl(photo.name)

        return (
          <img
            key={photo.name}
            src={data.publicUrl}
            alt=""
            width="250"
            style={{
              margin: '10px',
              borderRadius: '8px',
            }}
          />
        )
      })}
    </div>
  )
}