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

      const visitIds = (data || []).map(
        (visit) => visit.id
      )

      let groupedParts = {}

      if (visitIds.length > 0) {
        const { data: parts } = await supabase
          .from('service_parts')
          .select('*')
          .in('service_visit_id', visitIds)
          .order('created_at', { ascending: true })

        groupedParts = (parts || []).reduce(
          (groups, part) => ({
            ...groups,
            [part.service_visit_id]: [
              ...(groups[part.service_visit_id] || []),
              part,
            ],
          }),
          {}
        )
      }

      setVisits(data || [])
      setPartsByVisit(groupedParts)
      setLoading(false)
    }

    loadVisits()
  }, [registration, newVisit])

  async function deleteVisit(visit) {
    const confirmed = window.confirm(
      `Delete the service visit dated ${visit.service_date}?`
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
  }

  return (
    <div>
      <h2>Service History</h2>

      {loading && <p>Loading service history...</p>}

      {!loading &&
        visits.map((visit) => {
          const visitParts =
            partsByVisit[visit.id] || []

          return (
            <div
              key={visit.id}
              style={{
                border: '1px solid #ddd',
                padding: '20px',
                marginBottom: '20px',
                borderRadius: '10px',
              }}
            >
              <h3>{visit.service_date}</h3>

              <p>
                <strong>Mileage:</strong>{' '}
                {visit.mileage ?? 'Not recorded'}
              </p>

              <p>
                <strong>Technician:</strong>{' '}
                {visit.technician_name || 'Not recorded'}
              </p>

              <p>
                <strong>Status:</strong>{' '}
                {visit.job_status || 'Not recorded'}
              </p>

              <p>
                <strong>Entry Report:</strong>
              </p>
              <p>{visit.entry_report || 'Not recorded'}</p>

              <p>
                <strong>Repairs:</strong>
              </p>
              <p>
                {visit.repairs_report || 'Not recorded'}
              </p>

              <p>
                <strong>Summary:</strong>
              </p>
              <p>
                {visit.completion_summary ||
                  'Not recorded'}
              </p>

              <h4>Parts Used</h4>

              {visitParts.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>
                          Part
                        </th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>
                          Part Number
                        </th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>
                          Quantity
                        </th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>
                          Notes
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {visitParts.map((part) => (
                        <tr key={part.id}>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {part.part_name}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {part.part_number || '—'}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {part.quantity}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                            {part.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>
                  {visit.repair_parts ||
                    'No structured parts recorded.'}
                </p>
              )}

              <ServiceVisitFiles
                serviceVisitId={visit.id}
              />

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '20px',
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setEditingVisit(
                      editingVisit === visit.id
                        ? null
                        : visit.id
                    )
                  }
                >
                  {editingVisit === visit.id
                    ? 'Close Editor'
                    : 'Edit Visit'}
                </button>

                <button
                  type="button"
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

              {editingVisit === visit.id && (
                <EditServiceVisit
                  key={visit.id}
                  visit={visit}
                  onSaved={(updatedVisit) => {
                    setVisits((currentVisits) =>
                      currentVisits.map(
                        (currentVisit) =>
                          currentVisit.id ===
                          updatedVisit.id
                            ? updatedVisit
                            : currentVisit
                      )
                    )

                    setEditingVisit(null)
                  }}
                  onCancel={() =>
                    setEditingVisit(null)
                  }
                />
              )}
            </div>
          )
        })}
    </div>
  )
}