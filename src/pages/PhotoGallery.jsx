import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PhotoGallery({
  vehicle,
  newPhoto,
}) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFiles() {
      setLoading(true)

      const { data, error } = await supabase
        .from('vehicle_files')
        .select('*')
        .eq('registration', vehicle.registration)
        .order('created_at', { ascending: false })

      if (error) {
        alert(
          `Unable to load documents and photos: ${error.message}`
        )
        setLoading(false)
        return
      }

      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from('vehicle-photos')
              .createSignedUrl(file.storage_path, 3600)

          if (signedError) {
            return null
          }

          return {
            ...file,
            signedUrl: signedData.signedUrl,
          }
        })
      )

      setFiles(filesWithUrls.filter(Boolean))
      setLoading(false)
    }

    loadFiles()
  }, [vehicle.registration, newPhoto])

  return (
    <div>
      <h2>Uploaded Documents &amp; Photos</h2>

      {loading && (
        <p>Loading documents and photos...</p>
      )}

      {!loading && files.length === 0 && (
        <p>No documents or photos uploaded yet.</p>
      )}

      {!loading && files.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
          }}
        >
          {files.map((file) => (
            <div
              key={file.id}
              style={{
                width: '250px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '10px',
              }}
            >
              {file.mime_type?.startsWith('image/') ? (
                <a
                  href={file.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={file.signedUrl}
                    alt={
                      file.description || file.category
                    }
                    style={{
                      width: '100%',
                      borderRadius: '6px',
                    }}
                  />
                </a>
              ) : (
                <a
                  href={file.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Document
                </a>
              )}

              <p>
                <strong>{file.category}</strong>
              </p>

              {file.description && (
                <p>{file.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}