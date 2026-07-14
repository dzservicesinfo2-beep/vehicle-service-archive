import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PhotoGallery({
  vehicle,
  newPhoto,
}) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPhotos()
  }, [vehicle.registration])

  useEffect(() => {
    if (!newPhoto) {
      return
    }

    setPhotos((currentPhotos) => {
      const alreadyExists = currentPhotos.some(
        (photo) => photo.name === newPhoto.name
      )

      if (alreadyExists) {
        return currentPhotos
      }

      return [newPhoto, ...currentPhotos]
    })
  }, [newPhoto])

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

    setLoading(false)

    if (error) {
      alert(`Unable to load photos: ${error.message}`)
      return
    }

    const prefix = `${vehicle.registration}-`

    const vehiclePhotos = (data || []).filter((photo) =>
      photo.name.startsWith(prefix)
    )

    setPhotos(vehiclePhotos)
  }

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
                style={{
                  display: 'inline-block',
                }}
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