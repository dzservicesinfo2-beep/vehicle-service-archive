import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PhotoGallery({
  vehicle,
  newPhoto,
}) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] =
    useState('All')
  const [deletingFileId, setDeletingFileId] =
    useState(null)

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

        setFiles([])
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
            console.error(
              `Unable to create signed URL for ${file.original_file_name}:`,
              signedError
            )

            return {
              ...file,
              signedUrl: null,
            }
          }

          return {
            ...file,
            signedUrl: signedData.signedUrl,
          }
        })
      )

      setFiles(filesWithUrls)
      setLoading(false)
    }

    loadFiles()
  }, [vehicle.registration, newPhoto])

  const categories = useMemo(() => {
    const fileCategories = files
      .map((file) => file.category)
      .filter(Boolean)

    return ['All', ...new Set(fileCategories)]
  }, [files])

  const displayedFiles = useMemo(() => {
    if (activeCategory === 'All') {
      return files
    }

    return files.filter(
      (file) => file.category === activeCategory
    )
  }, [activeCategory, files])

  function formatDate(dateValue) {
    if (!dateValue) {
      return 'Date not recorded'
    }

    return new Date(dateValue).toLocaleDateString(
      'en-IE',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  function isImage(file) {
    return file.mime_type?.startsWith('image/')
  }

  function getFileTypeLabel(file) {
    if (isImage(file)) {
      return 'Image'
    }

    if (file.mime_type === 'application/pdf') {
      return 'PDF'
    }

    if (
      file.mime_type?.includes('word') ||
      file.original_file_name
        ?.toLowerCase()
        .endsWith('.doc') ||
      file.original_file_name
        ?.toLowerCase()
        .endsWith('.docx')
    ) {
      return 'Word'
    }

    return 'Document'
  }

  async function deleteFile(file) {
    const confirmed = window.confirm(
      `Delete "${file.original_file_name || 'this file'}"? This action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setDeletingFileId(file.id)

    const { error: storageError } =
      await supabase.storage
        .from('vehicle-photos')
        .remove([file.storage_path])

    if (storageError) {
      setDeletingFileId(null)

      alert(
        `Unable to delete the stored file: ${storageError.message}`
      )

      return
    }

    const { error: databaseError } = await supabase
      .from('vehicle_files')
      .delete()
      .eq('id', file.id)

    setDeletingFileId(null)

    if (databaseError) {
      alert(
        `The file was removed from storage, but its database record could not be deleted: ${databaseError.message}`
      )

      return
    }

    setFiles((currentFiles) =>
      currentFiles.filter(
        (currentFile) => currentFile.id !== file.id
      )
    )
  }

  return (
    <div className="photo-gallery">
      <div className="photo-gallery-heading">
        <div>
          <span className="vehicle-section-eyebrow">
            Vehicle Archive
          </span>

          <h3>Uploaded Documents &amp; Photos</h3>

          <p>
            Review all workshop images, reports, invoices
            and supporting documents.
          </p>
        </div>

        {!loading && (
          <span className="status-badge">
            {files.length}{' '}
            {files.length === 1 ? 'file' : 'files'}
          </span>
        )}
      </div>

      {!loading && files.length > 0 && (
        <div className="photo-gallery-filters">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={
                activeCategory === category
                  ? 'photo-filter-button active'
                  : 'photo-filter-button'
              }
              onClick={() =>
                setActiveCategory(category)
              }
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="photo-gallery-empty">
          Loading documents and photos...
        </div>
      )}

      {!loading && files.length === 0 && (
        <div className="photo-gallery-empty">
          <h4>No files uploaded yet</h4>

          <p>
            Uploaded workshop photos and documents will
            appear here.
          </p>
        </div>
      )}

      {!loading &&
        files.length > 0 &&
        displayedFiles.length === 0 && (
          <div className="photo-gallery-empty">
            No files found in this category.
          </div>
        )}

      {!loading && displayedFiles.length > 0 && (
        <div className="photo-gallery-grid">
          {displayedFiles.map((file) => (
            <article
              key={file.id}
              className="photo-gallery-card"
            >
              <div className="photo-gallery-preview">
                {isImage(file) && file.signedUrl ? (
                  <a
                    href={file.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="photo-gallery-image-link"
                  >
                    <img
                      src={file.signedUrl}
                      alt={
                        file.description ||
                        file.original_file_name ||
                        file.category
                      }
                      className="photo-gallery-image"
                    />

                    <span className="photo-gallery-open-overlay">
                      Open image
                    </span>
                  </a>
                ) : (
                  <div className="photo-document-preview">
                    <span className="photo-document-icon">
                      {getFileTypeLabel(file)}
                    </span>

                    <strong>
                      {file.original_file_name ||
                        'Vehicle document'}
                    </strong>
                  </div>
                )}

                <span className="photo-gallery-type">
                  {getFileTypeLabel(file)}
                </span>
              </div>

              <div className="photo-gallery-card-body">
                <div className="photo-gallery-card-header">
                  <span className="photo-gallery-category">
                    {file.category || 'Uncategorised'}
                  </span>

                  <span className="photo-gallery-date">
                    {formatDate(file.created_at)}
                  </span>
                </div>

                <h4>
                  {file.original_file_name ||
                    file.description ||
                    'Vehicle file'}
                </h4>

                <p>
                  {file.description ||
                    'No description recorded.'}
                </p>

                <div className="photo-gallery-card-actions">
                  {file.signedUrl ? (
                    <a
                      href={file.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="photo-gallery-open-button"
                    >
                      Open File
                    </a>
                  ) : (
                    <span className="photo-file-unavailable">
                      File unavailable
                    </span>
                  )}

                  <button
                    type="button"
                    className="danger-outline-button"
                    onClick={() => deleteFile(file)}
                    disabled={
                      deletingFileId === file.id
                    }
                  >
                    {deletingFileId === file.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}