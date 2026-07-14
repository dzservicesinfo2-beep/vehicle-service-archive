import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function EditServiceVisit({
  visit,
  onSaved,
  onCancel,
}) {
  const [entryReport, setEntryReport] = useState(
    visit.entry_report || ''
  )
  const [repairsReport, setRepairsReport] = useState(
    visit.repairs_report || ''
  )
  const [repairParts, setRepairParts] = useState(
    visit.repair_parts || ''
  )
  const [completionSummary, setCompletionSummary] = useState(
    visit.completion_summary || ''
  )
  const [saving, setSaving] = useState(false)

  const textareaStyle = {
    width: '900px',
    height: '200px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
  }

  async function saveVisit() {
    setSaving(true)

    const { data, error } = await supabase
      .from('service_visits')
      .update({
        entry_report: entryReport,
        repairs_report: repairsReport,
        repair_parts: repairParts,
        completion_summary: completionSummary,
      })
      .eq('id', visit.id)
      .select()
      .single()

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('Service visit updated successfully')

    if (onSaved) {
      onSaved(data)
    }
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <textarea
        value={entryReport}
        onChange={(e) => setEntryReport(e.target.value)}
        placeholder="Entry Report"
        style={textareaStyle}
      />

      <br /><br />

      <textarea
        value={repairsReport}
        onChange={(e) => setRepairsReport(e.target.value)}
        placeholder="Repairs"
        style={textareaStyle}
      />

      <br /><br />

      <textarea
        value={repairParts}
        onChange={(e) => setRepairParts(e.target.value)}
        placeholder="Parts"
        style={textareaStyle}
      />

      <br /><br />

      <textarea
        value={completionSummary}
        onChange={(e) => setCompletionSummary(e.target.value)}
        placeholder="Summary"
        style={textareaStyle}
      />

      <br /><br />

      <div
        style={{
          display: 'flex',
          gap: '10px',
        }}
      >
        <button
          onClick={saveVisit}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}