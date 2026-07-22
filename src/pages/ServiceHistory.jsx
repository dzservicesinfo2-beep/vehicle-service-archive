import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import EditServiceVisit from './EditServiceVisit'
import ServiceVisitFiles from './ServiceVisitFiles'

export default function ServiceHistory({
  registration,
  newVisit,
}) {
  const [visits, setVisits] = useState([])
  const [partsByVisit, setPartsByVisit] = useState({})
  const [editingVisit, setEditingVisit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingVisitId, setDeletingVisitId] =
    useState(null)

  useEffect(() => {
    async function loadVisits() {
      setLoading(true)

      const { data, error } = await supabase
        .from('service_visits')
        .select('*')
        .eq('registration', registration)
        .order('service_date', { ascending: false })
        .order('id', { ascending: false })

      if (error) {
        alert(
          `Unable to load service history: ${error.message}`
        )

        setLoading(false)
        return
      }

      const loadedVisits = data || []

      const visitIds = loadedVisits.map(
        (visit) => visit.id
      )

      let groupedParts = {}

      if (visitIds.length > 0) {
        const { data: parts, error: partsError } =
          await supabase
            .from('service_parts')
            .select('*')
            .in('service_visit_id', visitIds)
            .order('created_at', { ascending: true })

        if (partsError) {
          console.error(
            'Unable to load structured parts:',
            partsError
          )
        }

        groupedParts = (parts || []).reduce(
          (groups, part) => {
            const visitId = part.service_visit_id

            return {
              ...groups,
              [visitId]: [
                ...(groups[visitId] || []),
                part,
              ],
            }
          },
          {}
        )
      }

      setVisits(loadedVisits)
      setPartsByVisit(groupedParts)
      setLoading(false)
    }

    loadVisits()
  }, [registration, newVisit])

  async function deleteVisit(visit) {
    const confirmed = window.confirm(
      `Delete the service visit dated ${formatDate(
        visit.service_date
      )}? This action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setDeletingVisitId(visit.id)

    const { error } = await supabase
      .from('service_visits')
      .delete()
      .eq('id', visit.id)

    setDeletingVisitId(null)

    if (error) {
      alert(
        `Unable to delete service visit: ${error.message}`
      )

      return
    }

    setVisits((currentVisits) =>
      currentVisits.filter(
        (currentVisit) => currentVisit.id !== visit.id
      )
    )

    setPartsByVisit((currentParts) => {
      const updatedParts = { ...currentParts }

      delete updatedParts[visit.id]

      return updatedParts
    })

    if (editingVisit === visit.id) {
      setEditingVisit(null)
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return 'Date not recorded'
    }

    return new Date(
      `${dateValue}T00:00:00`
    ).toLocaleDateString('en-IE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  function formatMileage(value, unit) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 'Not recorded'
    }

    const numericValue = Number(value)

    const formattedValue = Number.isNaN(numericValue)
      ? value
      : numericValue.toLocaleString('en-IE')

    return `${formattedValue} ${unit || 'KM'}`
  }

  function getStatusClass(status) {
    if (status === 'Completed') {
      return 'status-badge status-success'
    }

    if (
      status === 'Waiting for Parts' ||
      status === 'Waiting for Inspection'
    ) {
      return 'status-badge status-warning'
    }

    return 'status-badge'
  }

  function handleVisitSaved(updatedVisit) {
    setVisits((currentVisits) =>
      currentVisits.map((currentVisit) =>
        currentVisit.id === updatedVisit.id
          ? updatedVisit
          : currentVisit
      )
    )

    setEditingVisit(null)
  }

  function toggleEditor(visitId) {
    setEditingVisit((currentVisitId) =>
      currentVisitId === visitId ? null : visitId
    )
  }

  return (
    <div className="service-history">
      <div className="service-history-heading">
        <div>
          <span className="vehicle-section-eyebrow">
            Workshop Job Cards
          </span>

          <h3>Service History</h3>

          <p>
            Review all workshop visits, mileage,
            technician details, parts and supporting files.
          </p>
        </div>

        {!loading && (
          <span className="status-badge">
            {visits.length}{' '}
            {visits.length === 1 ? 'visit' : 'visits'}
          </span>
        )}
      </div>

      {loading && (
        <div className="service-history-empty">
          Loading service history...
        </div>
      )}

      {!loading && visits.length === 0 && (
        <div className="service-history-empty">
          <h4>No service history yet</h4>

          <p>
            The first completed workshop visit will appear
            here.
          </p>
        </div>
      )}

      {!loading &&
        visits.map((visit, index) => {
          const visitParts =
            partsByVisit[visit.id] || []

          const isEditing =
            editingVisit === visit.id

          const jobNumber =
            visits.length - index

          return (
            <article
              key={visit.id}
              className="service-visit-card"
            >
              <header className="service-visit-card-header">
                <div>
                  <span className="service-visit-date-label">
                    Workshop visit #{jobNumber}
                  </span>

                  <h3>
                    {formatDate(visit.service_date)}
                  </h3>

                  <p className="service-visit-registration">
                    Vehicle: {registration}
                  </p>
                </div>

                <span
                  className={getStatusClass(
                    visit.job_status
                  )}
                >
                  {visit.job_status ||
                    'Status not recorded'}
                </span>
              </header>

              <div className="service-visit-meta">
                <div className="service-meta-item">
                  <span>Mileage</span>

                  <strong>
                    {formatMileage(
                      visit.mileage,
                      visit.mileage_unit
                    )}
                  </strong>
                </div>

                <div className="service-meta-item">
                  <span>Technician</span>

                  <strong>
                    {visit.technician_name ||
                      'Not recorded'}
                  </strong>
                </div>

                <div className="service-meta-item">
                  <span>Next service date</span>

                  <strong>
                    {visit.next_service_due_date
                      ? formatDate(
                          visit.next_service_due_date
                        )
                      : 'Not scheduled'}
                  </strong>
                </div>

                <div className="service-meta-item">
                  <span>Next service mileage</span>

                  <strong>
                    {visit.next_service_due_mileage != null
                      ? formatMileage(
                          visit.next_service_due_mileage,
                          visit.next_service_due_mileage_unit
                        )
                      : 'Not scheduled'}
                  </strong>
                </div>
              </div>

              <section className="service-job-section">
                <div className="service-job-section-heading">
                  <div>
                    <span className="vehicle-section-eyebrow">
                      Workshop Reports
                    </span>

                    <h4>Job Details</h4>
                  </div>
                </div>

                <div className="service-report-grid">
                  <section className="service-report-block">
                    <span className="service-report-label">
                      Vehicle on arrival
                    </span>

                    <h4>Entry Report</h4>

                    <p>
                      {visit.entry_report ||
                        'No entry report recorded.'}
                    </p>
                  </section>

                  <section className="service-report-block">
                    <span className="service-report-label">
                      Work completed
                    </span>

                    <h4>Repairs Report</h4>

                    <p>
                      {visit.repairs_report ||
                        'No repairs report recorded.'}
                    </p>
                  </section>

                  <section className="service-report-block service-report-full">
                    <span className="service-report-label">
                      Final workshop notes
                    </span>

                    <h4>Completion Summary</h4>

                    <p>
                      {visit.completion_summary ||
                        'No completion summary recorded.'}
                    </p>
                  </section>
                </div>
              </section>

              <section className="service-parts-section">
                <div className="service-job-section-heading">
                  <div>
                    <span className="vehicle-section-eyebrow">
                      Materials
                    </span>

                    <h4>Parts Used</h4>
                  </div>

                  <span className="status-badge">
                    {visitParts.length}{' '}
                    {visitParts.length === 1
                      ? 'part'
                      : 'parts'}
                  </span>
                </div>

                {visitParts.length > 0 ? (
                  <div className="service-table-wrapper">
                    <table className="service-parts-table">
                      <thead>
                        <tr>
                          <th>Part</th>
                          <th>Part Number</th>
                          <th>Quantity</th>
                          <th>Notes</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visitParts.map((part) => (
                          <tr key={part.id}>
                            <td>
                              <strong>
                                {part.part_name ||
                                  'Unnamed part'}
                              </strong>
                            </td>

                            <td>
                              {part.part_number || '—'}
                            </td>

                            <td>
                              {part.quantity ?? '—'}
                            </td>

                            <td>
                              {part.notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="service-inline-empty">
                    <p>
                      {visit.repair_parts ||
                        'No parts were recorded for this visit.'}
                    </p>
                  </div>
                )}
              </section>

              <section className="service-files-section">
                <div className="service-job-section-heading">
                  <div>
                    <span className="vehicle-section-eyebrow">
                      Attachments
                    </span>

                    <h4>Service Files</h4>

                    <p>
                      Photos, reports and documents linked
                      to this workshop visit.
                    </p>
                  </div>
                </div>

                <ServiceVisitFiles
                  serviceVisitId={visit.id}
                />
              </section>

              <footer className="service-visit-footer">
                <div>
                  <span className="service-visit-footer-label">
                    Workshop record
                  </span>

                  <p>
                    Edit this visit or permanently remove
                    it from the vehicle history.
                  </p>
                </div>

                <div className="service-visit-actions">
                  <button
                    type="button"
                    className={
                      isEditing
                        ? 'secondary-button'
                        : ''
                    }
                    onClick={() =>
                      toggleEditor(visit.id)
                    }
                  >
                    {isEditing
                      ? 'Close Editor'
                      : 'Edit Visit'}
                  </button>

                  <button
                    type="button"
                    className="danger-outline-button"
                    onClick={() => deleteVisit(visit)}
                    disabled={
                      deletingVisitId === visit.id
                    }
                  >
                    {deletingVisitId === visit.id
                      ? 'Deleting...'
                      : 'Delete Visit'}
                  </button>
                </div>
              </footer>

              {isEditing && (
                <div className="service-editor-container">
                  <EditServiceVisit
                    key={visit.id}
                    visit={visit}
                    onSaved={handleVisitSaved}
                    onCancel={() =>
                      setEditingVisit(null)
                    }
                  />
                </div>
              )}
            </article>
          )
        })}
    </div>
  )
}