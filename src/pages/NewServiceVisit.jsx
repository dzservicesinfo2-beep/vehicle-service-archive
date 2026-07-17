import { useState } from 'react'
import { supabase } from '../lib/supabase'

function createEmptyPart() {
  return {
    part_name: '',
    part_number: '',
    quantity: '1',
    notes: '',
  }
}

export default function NewServiceVisit({
  vehicle,
  onVisitAdded,
}) {
  const [entryReport, setEntryReport] = useState('')
  const [repairsReport, setRepairsReport] = useState('')
  const [completionSummary, setCompletionSummary] =
    useState('')
  const [mileage, setMileage] = useState('')
  const [technicianName, setTechnicianName] = useState('')
  const [jobStatus, setJobStatus] = useState('Completed')
  const [nextServiceDueDate, setNextServiceDueDate] =
    useState('')
  const [
    nextServiceDueMileage,
    setNextServiceDueMileage,
  ] = useState('')
  const [parts, setParts] = useState([createEmptyPart()])
  const [saving, setSaving] = useState(false)

  function updatePart(index, field, value) {
    setParts((currentParts) =>
      currentParts.map((part, partIndex) =>
        partIndex === index
          ? {
              ...part,
              [field]: value,
            }
          : part
      )
    )
  }

  function addPartRow() {
    setParts((currentParts) => [
      ...currentParts,
      createEmptyPart(),
    ])
  }

  function removePartRow(index) {
    setParts((currentParts) => {
      const remainingParts = currentParts.filter(
        (_part, partIndex) => partIndex !== index
      )

      return remainingParts.length > 0
        ? remainingParts
        : [createEmptyPart()]
    })
  }

  async function saveVisit(event) {
    event.preventDefault()

    const hasContent =
      entryReport.trim() ||
      repairsReport.trim() ||
      completionSummary.trim() ||
      parts.some((part) => part.part_name.trim())

    if (!hasContent) {
      alert('Enter service details or at least one part.')
      return
    }

    setSaving(true)

    const legacyPartsText = parts
      .filter((part) => part.part_name.trim())
      .map((part) => {
        const number = part.part_number.trim()
          ? ` (${part.part_number.trim()})`
          : ''

        return `${part.quantity || 1} × ${part.part_name.trim()}${number}`
      })
      .join(', ')

    const { data: visit, error: visitError } =
      await supabase
        .from('service_visits')
        .insert([
          {
            registration: vehicle.registration,
            service_date: new Date()
              .toISOString()
              .split('T')[0],
            entry_report: entryReport.trim(),
            repairs_report: repairsReport.trim(),
            repair_parts: legacyPartsText,
            completion_summary:
              completionSummary.trim(),
            mileage: mileage ? Number(mileage) : null,
            technician_name: technicianName.trim(),
            job_status: jobStatus,
            next_service_due_date:
              nextServiceDueDate || null,
            next_service_due_mileage:
              nextServiceDueMileage
                ? Number(nextServiceDueMileage)
                : null,
          },
        ])
        .select()
        .single()

    if (visitError) {
      setSaving(false)
      alert(
        `Unable to save service visit: ${visitError.message}`
      )
      return
    }

    const validParts = parts
      .filter((part) => part.part_name.trim())
      .map((part) => ({
        service_visit_id: visit.id,
        part_name: part.part_name.trim(),
        part_number: part.part_number.trim() || null,
        quantity: Number(part.quantity) || 1,
        notes: part.notes.trim() || null,
      }))

    if (validParts.length > 0) {
      const { error: partsError } = await supabase
        .from('service_parts')
        .insert(validParts)

      if (partsError) {
        setSaving(false)
        alert(
          `The visit was saved, but its parts table failed: ${partsError.message}`
        )
        return
      }
    }

    if (nextServiceDueDate || nextServiceDueMileage) {
      const { error: reminderError } = await supabase
        .from('service_reminders')
        .insert([
          {
            registration: vehicle.registration,
            source_service_visit_id: visit.id,
            due_date: nextServiceDueDate || null,
            due_mileage: nextServiceDueMileage
              ? Number(nextServiceDueMileage)
              : null,
            reminder_type: 'Service',
            notes: completionSummary.trim() || null,
            status: 'Open',
          },
        ])

      if (reminderError) {
        setSaving(false)
        alert(
          `The visit was saved, but its reminder failed: ${reminderError.message}`
        )
        return
      }
    }

    setEntryReport('')
    setRepairsReport('')
    setCompletionSummary('')
    setMileage('')
    setTechnicianName('')
    setJobStatus('Completed')
    setNextServiceDueDate('')
    setNextServiceDueMileage('')
    setParts([createEmptyPart()])
    setSaving(false)

    if (onVisitAdded) {
      onVisitAdded(visit)
    }

    alert('Service visit saved successfully.')
  }

  const inputStyle = {
    width: '100%',
    maxWidth: '900px',
    padding: '12px',
    fontSize: '16px',
    boxSizing: 'border-box',
  }

  const textareaStyle = {
    ...inputStyle,
    minHeight: '180px',
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
          placeholder="Completion Summary"
          value={completionSummary}
          onChange={(event) =>
            setCompletionSummary(event.target.value)
          }
          style={textareaStyle}
        />

        <h3>Visit Details</h3>

        <input
          type="number"
          placeholder="Vehicle Mileage"
          value={mileage}
          onChange={(event) =>
            setMileage(event.target.value)
          }
          min="0"
          style={inputStyle}
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Technician Name"
          value={technicianName}
          onChange={(event) =>
            setTechnicianName(event.target.value)
          }
          style={inputStyle}
        />

        <br />
        <br />

        <select
          value={jobStatus}
          onChange={(event) =>
            setJobStatus(event.target.value)
          }
          style={inputStyle}
        >
          <option>Booked In</option>
          <option>Waiting for Inspection</option>
          <option>Waiting for Parts</option>
          <option>Work in Progress</option>
          <option>Ready for Collection</option>
          <option>Completed</option>
        </select>

        <h3>Parts Used</h3>

        {parts.map((part, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '12px',
              maxWidth: '900px',
            }}
          >
            <input
              type="text"
              placeholder="Part Name"
              value={part.part_name}
              onChange={(event) =>
                updatePart(
                  index,
                  'part_name',
                  event.target.value
                )
              }
              style={inputStyle}
            />

            <br />
            <br />

            <input
              type="text"
              placeholder="Part Number"
              value={part.part_number}
              onChange={(event) =>
                updatePart(
                  index,
                  'part_number',
                  event.target.value
                )
              }
              style={inputStyle}
            />

            <br />
            <br />

            <input
              type="number"
              placeholder="Quantity"
              value={part.quantity}
              onChange={(event) =>
                updatePart(
                  index,
                  'quantity',
                  event.target.value
                )
              }
              min="0.01"
              step="0.01"
              style={inputStyle}
            />

            <br />
            <br />

            <input
              type="text"
              placeholder="Part Notes"
              value={part.notes}
              onChange={(event) =>
                updatePart(
                  index,
                  'notes',
                  event.target.value
                )
              }
              style={inputStyle}
            />

            <br />
            <br />

            <button
              type="button"
              onClick={() => removePartRow(index)}
            >
              Remove Part
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addPartRow}
        >
          Add Another Part
        </button>

        <h3>Internal Service Reminder</h3>

        <input
          type="date"
          value={nextServiceDueDate}
          onChange={(event) =>
            setNextServiceDueDate(event.target.value)
          }
          style={inputStyle}
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="Next Service Due Mileage"
          value={nextServiceDueMileage}
          onChange={(event) =>
            setNextServiceDueMileage(event.target.value)
          }
          min="0"
          style={inputStyle}
        />

        <br />
        <br />

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
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