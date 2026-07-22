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

  const [completionSummary, setCompletionSummary] =
    useState(visit.completion_summary || '')

  const [mileage, setMileage] = useState(
    visit.mileage ?? ''
  )

  const [mileageUnit, setMileageUnit] = useState(
    visit.mileage_unit || 'KM'
  )

  const [technicianName, setTechnicianName] = useState(
    visit.technician_name || ''
  )

  const [jobStatus, setJobStatus] = useState(
    visit.job_status || 'Completed'
  )

  const [nextServiceDueDate, setNextServiceDueDate] =
    useState(visit.next_service_due_date || '')

  const [
    nextServiceDueMileage,
    setNextServiceDueMileage,
  ] = useState(visit.next_service_due_mileage ?? '')

  const [
    nextServiceDueMileageUnit,
    setNextServiceDueMileageUnit,
  ] = useState(
    visit.next_service_due_mileage_unit || 'KM'
  )

  const [saving, setSaving] = useState(false)

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

  return (
    <form
      className="edit-service-form"
      onSubmit={saveVisit}
    >
      <div className="service-form-section-heading">
        <h4>Edit Service Visit</h4>

        <p>
          Update the recorded visit details, mileage,
          technician, reports and next-service information.
        </p>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor={`edit-mileage-${visit.id}`}>
            Vehicle mileage
          </label>

          <div className="mileage-input-row">
            <input
              id={`edit-mileage-${visit.id}`}
              type="number"
              min="0"
              value={mileage}
              onChange={(event) =>
                setMileage(event.target.value)
              }
              placeholder="Current mileage"
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
          <label
            htmlFor={`edit-technician-${visit.id}`}
          >
            Technician name
          </label>

          <input
            id={`edit-technician-${visit.id}`}
            type="text"
            value={technicianName}
            onChange={(event) =>
              setTechnicianName(event.target.value)
            }
            placeholder="Technician"
          />
        </div>

        <div className="form-group form-group-full">
          <label htmlFor={`edit-status-${visit.id}`}>
            Job status
          </label>

          <select
            id={`edit-status-${visit.id}`}
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

      <div className="form-group">
        <label htmlFor={`edit-entry-${visit.id}`}>
          Entry report
        </label>

        <textarea
          id={`edit-entry-${visit.id}`}
          value={entryReport}
          onChange={(event) =>
            setEntryReport(event.target.value)
          }
          placeholder="Vehicle condition, customer concerns and initial inspection"
        />
      </div>

      <div className="form-group">
        <label htmlFor={`edit-repairs-${visit.id}`}>
          Repairs report
        </label>

        <textarea
          id={`edit-repairs-${visit.id}`}
          value={repairsReport}
          onChange={(event) =>
            setRepairsReport(event.target.value)
          }
          placeholder="Repairs, checks and work carried out"
        />
      </div>

      <div className="form-group">
        <label htmlFor={`edit-parts-${visit.id}`}>
          Parts summary
        </label>

        <textarea
          id={`edit-parts-${visit.id}`}
          value={repairParts}
          onChange={(event) =>
            setRepairParts(event.target.value)
          }
          placeholder="Parts summary"
        />
      </div>

      <div className="form-group">
        <label htmlFor={`edit-summary-${visit.id}`}>
          Completion summary
        </label>

        <textarea
          id={`edit-summary-${visit.id}`}
          value={completionSummary}
          onChange={(event) =>
            setCompletionSummary(event.target.value)
          }
          placeholder="Final summary and customer information"
        />
      </div>

      <div className="service-edit-reminder">
        <div className="service-form-section-heading">
          <h4>Next Service</h4>

          <p>
            Update the next due date, mileage and mileage
            unit.
          </p>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label
              htmlFor={`edit-due-date-${visit.id}`}
            >
              Due date
            </label>

            <input
              id={`edit-due-date-${visit.id}`}
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
            <label
              htmlFor={`edit-due-mileage-${visit.id}`}
            >
              Due mileage
            </label>

            <div className="mileage-input-row">
              <input
                id={`edit-due-mileage-${visit.id}`}
                type="number"
                min="0"
                value={nextServiceDueMileage}
                onChange={(event) =>
                  setNextServiceDueMileage(
                    event.target.value
                  )
                }
                placeholder="Due mileage"
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
      </div>

      <div className="service-form-actions">
        <button
          type="submit"
          disabled={saving}
        >
          {saving
            ? 'Saving Changes...'
            : 'Save Changes'}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}