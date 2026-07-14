import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ServiceVisitPDF from './ServiceVisitPDF'

export default function CustomerServiceHistory({
  vehicle,
}) {
  const [visits, setVisits] = useState([])
  const [openVisit, setOpenVisit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadVisits() {
      setLoading(true)
      setErrorMessage('')
      setOpenVisit(null)

      const { data, error } = await supabase
        .from('service_visits')
        .select('*')
        .eq('registration', vehicle.registration)
        .order('service_date', {
          ascending: false,
        })
        .order('id', {
          ascending: false,
        })

      if (error) {
        setErrorMessage(
          `Unable to load service history: ${error.message}`
        )
        setLoading(false)
        return
      }

      setVisits(data || [])
      setLoading(false)
    }

    loadVisits()
  }, [vehicle.registration])

  return (
    <div>
      <h2>Service History</h2>

      {loading && <p>Loading service history...</p>}

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
        visits.length === 0 && (
          <p>No service visits found.</p>
        )}

      {!loading &&
        !errorMessage &&
        visits.map((visit) => (
          <div
            key={visit.id}
            style={{
              border: '1px solid #ddd',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '8px',
            }}
          >
            <h3>{visit.service_date}</h3>

            <button
              type="button"
              onClick={() =>
                setOpenVisit(
                  openVisit === visit.id
                    ? null
                    : visit.id
                )
              }
            >
              {openVisit === visit.id
                ? 'Close'
                : 'View'}
            </button>

            {openVisit === visit.id && (
              <div
                style={{
                  marginTop: '15px',
                }}
              >
                <p>
                  <strong>Entry Report:</strong>
                </p>

                <p>
                  {visit.entry_report ||
                    'Not recorded'}
                </p>

                <p>
                  <strong>Repairs:</strong>{' '}
                  {visit.repairs_report ||
                    'Not recorded'}
                </p>

                <p>
                  <strong>Parts:</strong>{' '}
                  {visit.repair_parts ||
                    'Not recorded'}
                </p>

                <p>
                  <strong>Summary:</strong>{' '}
                  {visit.completion_summary ||
                    'Not recorded'}
                </p>

                <ServiceVisitPDF
                  vehicle={vehicle}
                  visit={visit}
                />
              </div>
            )}
          </div>
        ))}
    </div>
  )
}