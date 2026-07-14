import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function EditServiceVisit({
  visit,
  onSaved,
  onCancel,
}) {
  const [entryReport, setEntryReport] = useState('')
  const [repairsReport, setRepairsReport] = useState('')
  const [repairParts, setRepairParts] = useState('')
  const [completionSummary, setCompletionSummary] =
    useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEntryReport(visit.entry_report || '')
    setRepairsReport(visit.repairs_report || '')
    setRepairParts(visit.repair_parts || '')
    setCompletionSummary(
      visit.completion_summary || ''
    )
  }, [visit])

  async function saveVisit(event) {
    event.preventDefault()

    setSaving(true)

    const { data, error } = await supabase
      .from('service_visits')
      .update({
        entry_report: entryReport.trim(),
        repairs_report: repairsReport.trim(),
        repair_parts: repairParts.trim(),
        completion_summary: completionSummary.trim(),
      })
      .eq('id', visit.id)
      .select()
      .single()

    setSaving(false)

    if (error) {
      alert(
        `Unable to update service visit: ${error.message}`
      )
      return
    }

    if (onSaved) {
      onSaved(data)
    }

    alert('Service visit updated successfully.')
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
    <form
      onSubmit={saveVisit}
      style={{ marginTop: '20px' }}
    >
      <textarea
        value={entryReport}
        onChange={(event) =>
          setEntryReport(event.target.value)
        }
        placeholder="Entry Report"
        style={textareaStyle}
      />

      <br />
      <br />

      <textarea
        value={repairsReport}
        onChange={(event) =>
          setRepairsReport(event.target.value)
        }
        placeholder="Repairs"
        style={textareaStyle}
      />

      <br />
      <br />

      <textarea
        value={repairParts}
        onChange={(event) =>
          setRepairParts(event.target.value)
        }
        placeholder="Parts"
        style={textareaStyle}
      />

      <br />
      <br />

      <textarea
        value={completionSummary}
        onChange={(event) =>
          setCompletionSummary(event.target.value)
        }
        placeholder="Summary"
        style={textareaStyle}
      />

      <br />
      <br />

      <div
        style={{
          display: 'flex',
          gap: '10px',
        }}
      >
        <button
          type="submit"
          disabled={saving}
        >
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}