import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PhotoGallery({
  vehicle,
  newPhoto,
}) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadPhotos() {
      setLoading(true)
      setErrorMessage('')

      const { data: files, error: listError } =
        await supabase.storage
          .from('vehicle-photos')
          .list('', {
            limit: 1000,
            sortBy: {
              column: 'created_at',
              order: 'desc',
            },
          })

      if (listError) {
        setErrorMessage(
          `Unable to load photos: ${listError.message}`
        )
        setLoading(false)
        return
      }

      const prefix = `${vehicle.registration}-`

      const vehicleFiles = (files || []).filter((file) =>
        file.name.startsWith(prefix)
      )

      const signedPhotos = await Promise.all(
        vehicleFiles.map(async (file) => {
          const { data, error } = await supabase.storage
            .from('vehicle-photos')
            .createSignedUrl(file.name, 3600)

          if (error) {
            return null
          }

          return {
            name: file.name,
            signedUrl: data.signedUrl,
          }
        })
      )

      setPhotos(signedPhotos.filter(Boolean))
      setLoading(false)
    }

    loadPhotos()
  }, [vehicle.registration, newPhoto])

  return (
    <div>
      <h2>Uploaded Photos</h2>

      {loading && <p>Loading photos...</p>}

      {!loading && errorMessage && (
        <p
          style={{
            color: '#b42318',
            fontWeight: 'bold',
          }}
        >
          {errorMessage}
        </p>
      )}

      {!loading &&
        !errorMessage &&
        photos.length === 0 && (
          <p>No photos uploaded yet.</p>
        )}

      {!loading &&
        !errorMessage &&
        photos.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '15px',
            }}
          >
            {photos.map((photo) => (
              <a
                key={photo.name}
                href={photo.signedUrl}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={photo.signedUrl}
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
            ))}
          </div>
        )}
    </div>
  )
}