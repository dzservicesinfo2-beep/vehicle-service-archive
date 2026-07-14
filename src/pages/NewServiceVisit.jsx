import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewServiceVisit({
  vehicle,
  onVisitAdded,
}) {
  const [entryReport, setEntryReport] = useState('')
  const [repairsReport, setRepairsReport] = useState('')
  const [repairParts, setRepairParts] = useState('')
  const [completionSummary, setCompletionSummary] =
    useState('')
  const [saving, setSaving] = useState(false)

  async function saveVisit(event) {
    event.preventDefault()

    const hasContent =
      entryReport.trim() ||
      repairsReport.trim() ||
      repairParts.trim() ||
      completionSummary.trim()

    if (!hasContent) {
      alert('Enter at least one service visit detail.')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('service_visits')
      .insert([
        {
          registration: vehicle.registration,
          service_date: new Date()
            .toISOString()
            .split('T')[0],
          entry_report: entryReport.trim(),
          repairs_report: repairsReport.trim(),
          repair_parts: repairParts.trim(),
          completion_summary: completionSummary.trim(),
        },
      ])
      .select()
      .single()

    setSaving(false)

    if (error) {
      alert(`Unable to save service visit: ${error.message}`)
      return
    }

    setEntryReport('')
    setRepairsReport('')
    setRepairParts('')
    setCompletionSummary('')

    if (onVisitAdded) {
      onVisitAdded(data)
    }

    alert('Service visit saved successfully.')
  }

  const textareaStyle = {
    width: '100%',
    maxWidth: '900px',
    minHeight: '200px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '16px',
    boxSizing: 'border-box',
    resize: 'vertical',
  }

  return (
    <div>
      <h2>Add Service Visit</h2>

      <form onSubmit={saveVisit}>
        <textarea
          placeholder="Entry Report"
          value={entryReport}
          onChange={(event) =>
            setEntryReport(event.target.value)
          }
          style={textareaStyle}
        />

        <br />
        <br />

        <textarea
          placeholder="Repairs Report"
          value={repairsReport}
          onChange={(event) =>
            setRepairsReport(event.target.value)
          }
          style={textareaStyle}
        />

        <br />
        <br />

        <textarea
          placeholder="Repair Parts"
          value={repairParts}
          onChange={(event) =>
            setRepairParts(event.target.value)
          }
          style={textareaStyle}
        />

        <br />
        <br />

        <textarea
          placeholder="Completion Summary"
          value={completionSummary}
          onChange={(event) =>
            setCompletionSummary(event.target.value)
          }
          style={textareaStyle}
        />

        <br />
        <br />

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving
            ? 'Saving Service Visit...'
            : 'Save Service Visit'}
        </button>
      </form>
    </div>
  )
}