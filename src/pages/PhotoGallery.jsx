import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PhotoGallery({
  vehicle,
  newPhoto,
}) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPhotos() {
      setLoading(true)

      const { data, error } = await supabase.storage
        .from('vehicle-photos')
        .list('', {
          limit: 1000,
          sortBy: {
            column: 'created_at',
            order: 'desc',
          },
        })

      if (error) {
        alert(`Unable to load photos: ${error.message}`)
        setLoading(false)
        return
      }

      const prefix = `${vehicle.registration}-`

      const vehiclePhotos = (data || []).filter((photo) =>
        photo.name.startsWith(prefix)
      )

      setPhotos(vehiclePhotos)
      setLoading(false)
    }

    loadPhotos()
  }, [vehicle.registration, newPhoto])

  return (
    <div>
      <h2>Uploaded Photos</h2>

      {loading && <p>Loading photos...</p>}

      {!loading && photos.length === 0 && (
        <p>No photos uploaded yet.</p>
      )}

      {!loading && photos.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
          }}
        >
          {photos.map((photo) => {
            const { data } = supabase.storage
              .from('vehicle-photos')
              .getPublicUrl(photo.name)

            return (
              <a
                key={photo.name}
                href={data.publicUrl}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={data.publicUrl}
                  alt={`Vehicle ${vehicle.registration}`}
                  width="250"
                  loading="lazy"
                  style={{
                    display: 'block',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                  }}
                />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}