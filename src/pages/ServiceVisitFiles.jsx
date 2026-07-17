import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ServiceVisitFiles({
  serviceVisitId,
}) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFiles() {
      setLoading(true)

      const { data, error } = await supabase
        .from('vehicle_files')
        .select('*')
        .eq('service_visit_id', serviceVisitId)
        .order('created_at', { ascending: false })

      if (error) {
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
  }, [serviceVisitId])

  if (loading) {
    return <p>Loading documents and photos...</p>
  }

  if (files.length === 0) {
    return null
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h4>Documents &amp; Photos</h4>

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
                  alt={file.description || file.category}
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
    </div>
  )
}