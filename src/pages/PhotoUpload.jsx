import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PhotoUpload({
  vehicle,
  onPhotoUploaded,
}) {
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] =
    useState('Workshop Photo')
  const [description, setDescription] = useState('')
  const [serviceVisitId, setServiceVisitId] = useState('')
  const [visits, setVisits] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function loadVisits() {
      const { data } = await supabase
        .from('service_visits')
        .select('id, service_date, completion_summary')
        .eq('registration', vehicle.registration)
        .order('service_date', { ascending: false })

      setVisits(data || [])
    }

    loadVisits()
  }, [vehicle.registration])

  async function uploadFile(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setUploading(true)

    const safeOriginalName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      '-'
    )

    const storagePath =
      `${vehicle.registration}-${Date.now()}-${safeOriginalName}`

    const { data: uploadedFile, error: uploadError } =
      await supabase.storage
        .from('vehicle-photos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

    if (uploadError) {
      setUploading(false)
      alert(`Upload failed: ${uploadError.message}`)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: metadata, error: metadataError } =
      await supabase
        .from('vehicle_files')
        .insert([
          {
            registration: vehicle.registration,
            service_visit_id: serviceVisitId || null,
            storage_path: uploadedFile.path,
            original_file_name: file.name,
            mime_type: file.type || null,
            category,
            description: description.trim() || null,
            uploaded_by: user?.id || null,
          },
        ])
        .select()
        .single()

    setUploading(false)

    if (metadataError) {
      await supabase.storage
        .from('vehicle-photos')
        .remove([uploadedFile.path])

      alert(
        `The file metadata could not be saved: ${metadataError.message}`
      )
      return
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setDescription('')
    setServiceVisitId('')

    if (onPhotoUploaded) {
      onPhotoUploaded(metadata)
    }

    alert('Document or photo uploaded successfully.')
  }

  const fieldStyle = {
    width: '100%',
    maxWidth: '700px',
    padding: '10px',
    boxSizing: 'border-box',
  }

  return (
    <div>
      <h2>Documents &amp; Photos</h2>

      <select
        value={category}
        onChange={(event) =>
          setCategory(event.target.value)
        }
        style={fieldStyle}
      >
        <option>Workshop Photo</option>
        <option>Damage Photo</option>
        <option>Completed Work</option>
        <option>Invoice</option>
        <option>Receipt</option>
        <option>Report</option>
        <option>Other</option>
      </select>

      <br />
      <br />

      <select
        value={serviceVisitId}
        onChange={(event) =>
          setServiceVisitId(event.target.value)
        }
        style={fieldStyle}
      >
        <option value="">
          Vehicle-wide file — not linked to a visit
        </option>

        {visits.map((visit) => (
          <option
            key={visit.id}
            value={visit.id}
          >
            {visit.service_date} —{' '}
            {visit.completion_summary || 'Service Visit'}
          </option>
        ))}
      </select>

      <br />
      <br />

      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(event) =>
          setDescription(event.target.value)
        }
        style={fieldStyle}
      />

      <br />
      <br />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        onChange={uploadFile}
        disabled={uploading}
      />

      {uploading && (
        <p>Uploading document or photo...</p>
      )}
    </div>
  )
}