import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const FILE_CATEGORIES = [
  'Before Repair',
  'During Repair',
  'After Repair',
  'Damage Photo',
  'Invoice',
  'Receipt',
  'CVRT Report',
  'Diagnostic Report',
  'Other Document',
]

export default function PhotoUpload({
  vehicle,
  onPhotoUploaded,
}) {
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] =
    useState('Before Repair')
  const [description, setDescription] = useState('')
  const [serviceVisitId, setServiceVisitId] = useState('')
  const [visits, setVisits] = useState([])
  const [selectedFileName, setSelectedFileName] =
    useState('')

  const fileInputRef = useRef(null)

  useEffect(() => {
    async function loadVisits() {
      const { data, error } = await supabase
        .from('service_visits')
        .select('id, service_date, completion_summary')
        .eq('registration', vehicle.registration)
        .order('service_date', { ascending: false })

      if (error) {
        console.error(
          'Unable to load service visits:',
          error
        )

        setVisits([])
        return
      }

      setVisits(data || [])
    }

    loadVisits()
  }, [vehicle.registration])

  function formatVisitDate(dateValue) {
    if (!dateValue) {
      return 'Date not recorded'
    }

    return new Date(
      `${dateValue}T00:00:00`
    ).toLocaleDateString('en-IE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function resetForm() {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setDescription('')
    setServiceVisitId('')
    setSelectedFileName('')
  }

  async function uploadFile(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setSelectedFileName(file.name)
    setUploading(true)

    const safeRegistration =
      vehicle.registration.replace(
        /[^a-zA-Z0-9_-]/g,
        '-'
      )

    const safeOriginalName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      '-'
    )

    const storagePath =
      `${safeRegistration}/${Date.now()}-${safeOriginalName}`

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

    if (metadataError) {
      await supabase.storage
        .from('vehicle-photos')
        .remove([uploadedFile.path])

      setUploading(false)

      alert(
        `The file metadata could not be saved: ${metadataError.message}`
      )

      return
    }

    resetForm()
    setUploading(false)

    if (onPhotoUploaded) {
      onPhotoUploaded(metadata)
    }

    alert('Document or photo uploaded successfully.')
  }

  return (
    <div className="photo-upload">
      <div className="photo-upload-heading">
        <span className="vehicle-section-eyebrow">
          Add Vehicle File
        </span>

        <h3>Upload Document or Photo</h3>

        <p>
          Store workshop photos, invoices, reports and
          other documents against this vehicle.
        </p>
      </div>

      <div className="photo-upload-form">
        <div className="form-group">
          <label htmlFor="vehicle-file-category">
            File category
          </label>

          <select
            id="vehicle-file-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            disabled={uploading}
          >
            {FILE_CATEGORIES.map((fileCategory) => (
              <option
                key={fileCategory}
                value={fileCategory}
              >
                {fileCategory}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="vehicle-file-visit">
            Related service visit
          </label>

          <select
            id="vehicle-file-visit"
            value={serviceVisitId}
            onChange={(event) =>
              setServiceVisitId(event.target.value)
            }
            disabled={uploading}
          >
            <option value="">
              Vehicle-wide file — not linked to a visit
            </option>

            {visits.map((visit) => (
              <option
                key={visit.id}
                value={visit.id}
              >
                {formatVisitDate(visit.service_date)} —{' '}
                {visit.completion_summary ||
                  'Service Visit'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="vehicle-file-description">
            Description
          </label>

          <textarea
            id="vehicle-file-description"
            rows="4"
            placeholder="Example: Front bumper damage before repair"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            disabled={uploading}
          />
        </div>

        <div className="photo-file-picker">
          <input
            ref={fileInputRef}
            id="vehicle-file-input"
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={uploadFile}
            disabled={uploading}
          />

          <label
            htmlFor="vehicle-file-input"
            className={
              uploading
                ? 'photo-file-picker-label disabled'
                : 'photo-file-picker-label'
            }
          >
            <span className="photo-file-picker-icon">
              +
            </span>

            <span>
              <strong>
                {uploading
                  ? 'Uploading file...'
                  : 'Choose a file'}
              </strong>

              <small>
                Images, PDF, Word documents
              </small>
            </span>
          </label>

          {selectedFileName && (
            <p className="photo-selected-file">
              Selected: {selectedFileName}
            </p>
          )}
        </div>

        {uploading && (
          <div className="photo-upload-status">
            Uploading and saving vehicle file...
          </div>
        )}
      </div>
    </div>
  )
}