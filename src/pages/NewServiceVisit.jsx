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
  const [mileageUnit, setMileageUnit] = useState('KM')

  const [technicianName, setTechnicianName] = useState('')
  const [jobStatus, setJobStatus] = useState('Completed')

  const [nextServiceDueDate, setNextServiceDueDate] =
    useState('')

  const [
    nextServiceDueMileage,
    setNextServiceDueMileage,
  ] = useState('')

  const [
    nextServiceDueMileageUnit,
    setNextServiceDueMileageUnit,
  ] = useState('KM')

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
      mileage ||
      technicianName.trim() ||
      parts.some((part) => part.part_name.trim())

    if (!hasContent) {
      alert('Enter service details or at least one part.')
      return
    }

    setSaving(true)

    const validParts = parts.filter((part) =>
      part.part_name.trim()
    )

    const legacyPartsText = validParts
      .map((part) => {
        const partNumber = part.part_number.trim()
          ? ` (${part.part_number.trim()})`
          : ''

        return `${part.quantity || 1} × ${part.part_name.trim()}${partNumber}`
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
            mileage_unit: mileageUnit,

            technician_name: technicianName.trim(),
            job_status: jobStatus,

            next_service_due_date:
              nextServiceDueDate || null,

            next_service_due_mileage:
              nextServiceDueMileage
                ? Number(nextServiceDueMileage)
                : null,

            next_service_due_mileage_unit:
              nextServiceDueMileageUnit,
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

    if (validParts.length > 0) {
      const structuredParts = validParts.map((part) => ({
        service_visit_id: visit.id,
        part_name: part.part_name.trim(),
        part_number: part.part_number.trim() || null,
        quantity: Number(part.quantity) || 1,
        notes: part.notes.trim() || null,
      }))

      const { error: partsError } = await supabase
        .from('service_parts')
        .insert(structuredParts)

      if (partsError) {
        setSaving(false)

        alert(
          `The service visit was saved, but its parts could not be saved: ${partsError.message}`
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

            due_mileage_unit:
              nextServiceDueMileageUnit,

            reminder_type: 'Service',
            notes: completionSummary.trim() || null,
            status: 'Open',
          },
        ])

      if (reminderError) {
        setSaving(false)

        alert(
          `The service visit was saved, but its reminder could not be saved: ${reminderError.message}`
        )

        return
      }
    }

    setEntryReport('')
    setRepairsReport('')
    setCompletionSummary('')

    setMileage('')
    setMileageUnit('KM')

    setTechnicianName('')
    setJobStatus('Completed')

    setNextServiceDueDate('')
    setNextServiceDueMileage('')
    setNextServiceDueMileageUnit('KM')

    setParts([createEmptyPart()])
    setSaving(false)

    if (onVisitAdded) {
      onVisitAdded(visit)
    }

    alert('Service visit saved successfully.')
  }

  return (
    <div className="service-form-container">
      <div className="service-form-heading">
        <div>
          <h3>Add Service Visit</h3>

          <p>
            Record the inspection, repairs, parts, mileage
            and next-service information.
          </p>
        </div>
      </div>

      <form
        className="service-form"
        onSubmit={saveVisit}
      >
        <section className="service-form-section">
          <div className="service-form-section-heading">
            <h4>Service Reports</h4>

            <p>
              Record the vehicle condition and completed
              work.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="entry-report">
              Entry report
            </label>

            <textarea
              id="entry-report"
              placeholder="Vehicle condition, customer concerns and initial inspection"
              value={entryReport}
              onChange={(event) =>
                setEntryReport(event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="repairs-report">
              Repairs report
            </label>

            <textarea
              id="repairs-report"
              placeholder="Repairs, checks and work carried out"
              value={repairsReport}
              onChange={(event) =>
                setRepairsReport(event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="completion-summary">
              Completion summary
            </label>

            <textarea
              id="completion-summary"
              placeholder="Final summary and customer information"
              value={completionSummary}
              onChange={(event) =>
                setCompletionSummary(event.target.value)
              }
            />
          </div>
        </section>

        <section className="service-form-section">
          <div className="service-form-section-heading">
            <h4>Visit Details</h4>

            <p>
              Record the mileage, mileage unit, technician
              and current job status.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="service-mileage">
                Vehicle mileage
              </label>

              <div className="mileage-input-row">
                <input
                  id="service-mileage"
                  type="number"
                  placeholder="Current mileage"
                  min="0"
                  value={mileage}
                  onChange={(event) =>
                    setMileage(event.target.value)
                  }
                />

                <select
                  aria-label="Vehicle mileage unit"
                  value={mileageUnit}
                  onChange={(event) =>
                    setMileageUnit(event.target.value)
                  }
                >
                  <option value="KM">KM</option>
                  <option value="Miles">Miles</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="technician-name">
                Technician name
              </label>

              <input
                id="technician-name"
                type="text"
                placeholder="Technician"
                value={technicianName}
                onChange={(event) =>
                  setTechnicianName(event.target.value)
                }
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="job-status">
                Job status
              </label>

              <select
                id="job-status"
                value={jobStatus}
                onChange={(event) =>
                  setJobStatus(event.target.value)
                }
              >
                <option value="Booked In">
                  Booked In
                </option>

                <option value="Waiting for Inspection">
                  Waiting for Inspection
                </option>

                <option value="Waiting for Parts">
                  Waiting for Parts
                </option>

                <option value="Work in Progress">
                  Work in Progress
                </option>

                <option value="Ready for Collection">
                  Ready for Collection
                </option>

                <option value="Completed">
                  Completed
                </option>
              </select>
            </div>
          </div>
        </section>

        <section className="service-form-section">
          <div className="service-form-section-heading">
            <h4>Parts Used</h4>

            <p>
              Add every fitted or supplied part as a
              separate entry.
            </p>
          </div>

          <div className="parts-form-list">
            {parts.map((part, index) => (
              <div
                key={index}
                className="part-form-card"
              >
                <div className="part-form-card-heading">
                  <h5>Part {index + 1}</h5>

                  <button
                    type="button"
                    className="danger-outline-button"
                    onClick={() => removePartRow(index)}
                  >
                    Remove
                  </button>
                </div>

                <div className="parts-form-grid">
                  <div className="form-group">
                    <label
                      htmlFor={`part-name-${index}`}
                    >
                      Part name
                    </label>

                    <input
                      id={`part-name-${index}`}
                      type="text"
                      placeholder="Part name"
                      value={part.part_name}
                      onChange={(event) =>
                        updatePart(
                          index,
                          'part_name',
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor={`part-number-${index}`}
                    >
                      Part number
                    </label>

                    <input
                      id={`part-number-${index}`}
                      type="text"
                      placeholder="Part number"
                      value={part.part_number}
                      onChange={(event) =>
                        updatePart(
                          index,
                          'part_number',
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor={`part-quantity-${index}`}
                    >
                      Quantity
                    </label>

                    <input
                      id={`part-quantity-${index}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={part.quantity}
                      onChange={(event) =>
                        updatePart(
                          index,
                          'quantity',
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor={`part-notes-${index}`}
                    >
                      Notes
                    </label>

                    <input
                      id={`part-notes-${index}`}
                      type="text"
                      placeholder="Optional notes"
                      value={part.notes}
                      onChange={(event) =>
                        updatePart(
                          index,
                          'notes',
                          event.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={addPartRow}
          >
            Add Another Part
          </button>
        </section>

        <section className="service-form-section">
          <div className="service-form-section-heading">
            <h4>Internal Service Reminder</h4>

            <p>
              Set the next service date, mileage, mileage
              unit or both.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="next-service-date">
                Next service due date
              </label>

              <input
                id="next-service-date"
                type="date"
                value={nextServiceDueDate}
                onChange={(event) =>
                  setNextServiceDueDate(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="next-service-mileage">
                Next service due mileage
              </label>

              <div className="mileage-input-row">
                <input
                  id="next-service-mileage"
                  type="number"
                  placeholder="Due mileage"
                  min="0"
                  value={nextServiceDueMileage}
                  onChange={(event) =>
                    setNextServiceDueMileage(
                      event.target.value
                    )
                  }
                />

                <select
                  aria-label="Next service mileage unit"
                  value={nextServiceDueMileageUnit}
                  onChange={(event) =>
                    setNextServiceDueMileageUnit(
                      event.target.value
                    )
                  }
                >
                  <option value="KM">KM</option>
                  <option value="Miles">Miles</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <div className="service-form-actions">
          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving Service Visit...'
              : 'Save Service Visit'}
          </button>
        </div>
      </form>
    </div>
  )
}