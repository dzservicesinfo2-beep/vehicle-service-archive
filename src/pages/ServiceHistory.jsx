import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import EditServiceVisit from './EditServiceVisit'

export default function ServiceHistory({ registration }) {
  const [visits, setVisits] = useState([])
  const [editingVisit, setEditingVisit] = useState(null)

  useEffect(() => {
    loadVisits()
  }, [registration])

  async function loadVisits() {
    const { data, error } = await supabase
      .from('service_visits')
      .select('*')
      .eq('registration', registration)
      .order('service_date', { ascending: false })

    if (error) {
      console.error(error)
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

    const { error } = await supabase
      .from('service_visits')
      .delete()
      .eq('id', visit.id)

    if (error) {
      alert(error.message)
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

    alert('Service visit deleted successfully')
  }

  return (
    <div>
      <h2 style={{ marginTop: '20px' }}>
        Service History
      </h2>

      {visits.length === 0 ? (
        <p>No service visits yet.</p>
      ) : (
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
              <strong>Entry Report</strong>
            </p>

            <p>{visit.entry_report}</p>

            <p>
              <strong>Repairs:</strong>{' '}
              {visit.repairs_report}
            </p>

            <p>
              <strong>Parts:</strong>{' '}
              {visit.repair_parts}
            </p>

            <p>
              <strong>Summary:</strong>{' '}
              {visit.completion_summary}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '15px',
              }}
            >
              <button
                onClick={() =>
                  setEditingVisit(
                    editingVisit === visit.id
                      ? null
                      : visit.id
                  )
                }
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
                onClick={() => deleteVisit(visit)}
                style={{
                  backgroundColor: '#b42318',
                  color: 'white',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Delete Visit
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
        ))
      )}
    </div>
  )
}