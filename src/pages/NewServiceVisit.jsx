import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewServiceVisit({ vehicle }) {
  const [entryReport, setEntryReport] = useState('')
  const [repairsReport, setRepairsReport] = useState('')
  const [repairParts, setRepairParts] = useState('')
  const [completionSummary, setCompletionSummary] = useState('')

  async function saveVisit() {
    const { error } = await supabase
      .from('service_visits')
     .insert([
  {
    registration: vehicle.registration,
    service_date: new Date().toISOString().split('T')[0],
    entry_report: entryReport,
    repairs_report: repairsReport,
    repair_parts: repairParts,
    completion_summary: completionSummary,
  },
])
    if (error) {
      alert(error.message)
      return
    }

    alert('Service visit saved')

    setEntryReport('')
    setRepairsReport('')
    setRepairParts('')
    setCompletionSummary('')
  }

  return (
    <div>
      <h2>Add Service Visit</h2>

      <textarea
  placeholder="Entry Report"
  value={entryReport}
  onChange={(e) => setEntryReport(e.target.value)}
  style={{
    width: '900px',
    height: '200px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
  }}
/>
      <br /><br />

      <textarea
  placeholder="Repairs Report"
  value={repairsReport}
  onChange={(e) => setRepairsReport(e.target.value)}
  style={{
    width: '900px',
    height: '200px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
  }}
/>
      <br /><br />

      <textarea
  placeholder="Repair Parts"
  value={repairParts}
  onChange={(e) => setRepairParts(e.target.value)}
  style={{
    width: '900px',
    height: '200px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
  }}
/>
      <br /><br />

      <textarea
  placeholder="Completion Summary"
  value={completionSummary}
  onChange={(e) => setCompletionSummary(e.target.value)}
  style={{
    width: '900px',
    height: '200px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
  }}
/>
      <br /><br />

      <button onClick={saveVisit}>
        Save Service Visit
      </button>
    </div>
  )
}