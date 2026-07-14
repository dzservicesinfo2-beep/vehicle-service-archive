import ServiceVisitPDF from './ServiceVisitPDF'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CustomerServiceHistory({
  vehicle,
}) {
const [visits, setVisits] = useState([])
const [openVisit, setOpenVisit] = useState(null)

useEffect(() => {
loadVisits()
}, [vehicle])

async function loadVisits() {
const { data, error } = await supabase
.from('service_visits')
.select('*')
.eq('registration', vehicle.registration)
.order('service_date', {
ascending: false,
})

if (error) {
  console.error(error)
  return
}

setVisits(data || [])

}

return ( <div> <h2>Service History</h2>

  {visits.map((visit) => (
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
        onClick={() =>
          setOpenVisit(
            openVisit === visit.id
              ? null
              : visit.id
          )
        }
      >
        View
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
