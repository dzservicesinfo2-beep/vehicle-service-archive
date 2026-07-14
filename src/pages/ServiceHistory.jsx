import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import EditServiceVisit from './EditServiceVisit'

export default function ServiceHistory({
  registration,
  newVisit,
}) {
  const [visits, setVisits] = useState([])
  const [editingVisit, setEditingVisit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingVisitId, setDeletingVisitId] =
    useState(null)

  useEffect(() => {
    loadVisits()
  }, [registration])

  useEffect(() => {
    if (!newVisit) {
      return
    }

    setVisits((currentVisits) => {
      const alreadyExists = currentVisits.some(
        (visit) => visit.id === newVisit.id
      )

      if (alreadyExists) {
        return currentVisits
      }

      return [newVisit, ...currentVisits]
    })
  }, [newVisit])

  async function loadVisits() {
    setLoading(true)

    const { data, error } = await supabase
      .from('service_visits')
      .select('*')
      .eq('registration', registration)
      .order('service_date', { ascending: false })
      .order('id', { ascending: false })

    setLoading(false)

    if (error) {
      alert(
        `Unable to load service history: ${error.message}`
      )
      return
    }

    setVisits(data || [])
  }

  async function deleteVisit(visit) {
    const confirmed = window.confirm(
      `Delete the service visit dated ${visit.service_date}? This cannot be undone.`
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

    if (editingVisit === visit.id) {
      setEditingVisit(null)
    }

    alert('Service visit deleted successfully.')
  }

  return (
    <div>
      <h2 style={{ marginTop: '20px' }}>
        Service History
      </h2>

      {loading && <p>Loading service history...</p>}

      {!loading && visits.length === 0 && (
        <p>No service visits yet.</p>
      )}

      {!loading &&
        visits.map((visit) => (
          <div
            key={visit.id}
            style={{
              border: '1px solid #ddd',
              padding: '20px',
              marginBottom: '20px',
              borderRadius: '10px',
              backgroundColor: '#fafafa',
            }}
          >
            <h3>
              Service Date: {visit.service_date}
            </h3>

            <p>
              <strong>Entry Report:</strong>
            </p>

            <p>
              {visit.entry_report || 'Not recorded'}
            </p>

            <p>
              <strong>Repairs:</strong>{' '}
              {visit.repairs_report || 'Not recorded'}
            </p>

            <p>
              <strong>Parts:</strong>{' '}
              {visit.repair_parts || 'Not recorded'}
            </p>

            <p>
              <strong>Summary:</strong>{' '}
              {visit.completion_summary || 'Not recorded'}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '15px',
                flexWrap: 'wrap',
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
                disabled={deletingVisitId === visit.id}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                }}
              >
                {editingVisit === visit.id
                  ? 'Close Editor'
                  : 'Edit Visit'}
              </button>

              <button
                type="button"
                onClick={() => deleteVisit(visit)}
                disabled={deletingVisitId === visit.id}
                style={{
                  backgroundColor: '#b42318',
                  color: 'white',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor:
                    deletingVisitId === visit.id
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {deletingVisitId === visit.id
                  ? 'Deleting...'
                  : 'Delete Visit'}
              </button>
            </div>

            {editingVisit === visit.id && (
              <EditServiceVisit
                visit={visit}
                onSaved={(updatedVisit) => {
                  setVisits((currentVisits) =>
                    currentVisits.map((currentVisit) =>
                      currentVisit.id === updatedVisit.id
                        ? updatedVisit
                        : currentVisit
                    )
                  )

                  setEditingVisit(null)
                }}
                onCancel={() => {
                  setEditingVisit(null)
                }}
              />
            )}
          </div>
        ))}
    </div>
  )
}