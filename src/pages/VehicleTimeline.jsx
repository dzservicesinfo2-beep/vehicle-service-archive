import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function VehicleTimeline({
  registration,
}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTimeline() {
      setLoading(true)

      const [
        visitsResult,
        filesResult,
        auditResult,
      ] = await Promise.all([
        supabase
          .from('service_visits')
          .select(
            'id, service_date, mileage, completion_summary, created_at'
          )
          .eq('registration', registration),

        supabase
          .from('vehicle_files')
          .select(
            'id, category, description, created_at'
          )
          .eq('registration', registration),

        supabase
          .from('audit_log')
          .select(
            'id, action, table_name, changed_by_email, created_at'
          )
          .eq('registration', registration),
      ])

      const visitEvents = (
        visitsResult.data || []
      ).map((visit) => ({
        id: `visit-${visit.id}`,
        date: visit.created_at || visit.service_date,
        title: 'Service Visit',
        detail:
          visit.completion_summary ||
          'Service visit recorded',
        mileage: visit.mileage,
      }))

      const fileEvents = (
        filesResult.data || []
      ).map((file) => ({
        id: `file-${file.id}`,
        date: file.created_at,
        title: file.category,
        detail:
          file.description ||
          'Document or photo uploaded',
      }))

      const auditEvents = (
        auditResult.data || []
      ).map((audit) => ({
        id: `audit-${audit.id}`,
        date: audit.created_at,
        title: `${audit.action} — ${audit.table_name}`,
        detail:
          audit.changed_by_email ||
          'System activity',
      }))

      setEvents(
        [
          ...visitEvents,
          ...fileEvents,
          ...auditEvents,
        ].sort(
          (first, second) =>
            new Date(second.date) -
            new Date(first.date)
        )
      )

      setLoading(false)
    }

    loadTimeline()
  }, [registration])

  return (
    <div style={{ marginTop: '30px' }}>
      <h2>Vehicle Timeline</h2>

      {loading && <p>Loading timeline...</p>}

      {!loading && events.length === 0 && (
        <p>No timeline events recorded yet.</p>
      )}

      {!loading &&
        events.map((event) => (
          <div
            key={event.id}
            style={{
              borderLeft: '4px solid #444',
              paddingLeft: '15px',
              marginBottom: '20px',
            }}
          >
            <strong>{event.title}</strong>

            <p style={{ margin: '5px 0' }}>
              {new Date(event.date).toLocaleString()}
            </p>

            <p>{event.detail}</p>

            {event.mileage != null && (
              <p>Mileage: {event.mileage}</p>
            )}
          </div>
        ))}
    </div>
  )
}