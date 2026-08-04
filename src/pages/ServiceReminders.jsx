import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'

function formatDate(value) {
  if (!value) {
    return 'Not set'
  }

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatMileage(value, unit) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Not set'
  }

  return `${Number(value).toLocaleString(
    'en-IE'
  )} ${unit || 'KM'}`
}

function isOverdue(dueDate) {
  if (!dueDate) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const reminderDate = new Date(
    `${dueDate}T00:00:00`
  )

  return reminderDate < today
}

function daysUntilDue(dueDate) {
  if (!dueDate) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const reminderDate = new Date(
    `${dueDate}T00:00:00`
  )

  return Math.round(
    (reminderDate - today) /
      (1000 * 60 * 60 * 24)
  )
}

export default function ServiceReminders({
  backToDashboard,
  openVehicleSearch,
}) {
  const [reminders, setReminders] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('Open')

  const [editingReminder, setEditingReminder] =
    useState(null)

  const [editDueDate, setEditDueDate] =
    useState('')

  const [editDueMileage, setEditDueMileage] =
    useState('')

  const [editMileageUnit, setEditMileageUnit] =
    useState('KM')

  const [editNotes, setEditNotes] =
    useState('')

  const [savingReminder, setSavingReminder] =
    useState(false)

  const [processingReminderId, setProcessingReminderId] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  const loadReminders = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    const [remindersResult, vehiclesResult] =
      await Promise.all([
        supabase
          .from('service_reminders')
          .select('*')
          .order('due_date', {
            ascending: true,
            nullsFirst: false,
          })
          .order('id', {
            ascending: false,
          }),

        supabase
          .from('vehicles')
          .select(
            `
              registration,
              customer_name,
              email,
              phone,
              make,
              model,
              year
            `
          )
          .order('registration', {
            ascending: true,
          }),
      ])

    if (remindersResult.error) {
      setErrorMessage(
        `Unable to load reminders: ${remindersResult.error.message}`
      )
      setLoading(false)
      return
    }

    if (vehiclesResult.error) {
      setErrorMessage(
        `Unable to load vehicle details: ${vehiclesResult.error.message}`
      )
      setLoading(false)
      return
    }

    setReminders(remindersResult.data || [])
    setVehicles(vehiclesResult.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  const reminderRecords = useMemo(() => {
    return reminders.map((reminder) => {
      const vehicle =
        vehicles.find(
          (currentVehicle) =>
            currentVehicle.registration ===
            reminder.registration
        ) || null

      const daysRemaining = daysUntilDue(
        reminder.due_date
      )

      return {
        ...reminder,
        vehicle,
        overdue:
          reminder.status === 'Open' &&
          isOverdue(reminder.due_date),
        daysRemaining,
      }
    })
  }, [reminders, vehicles])

  const filteredReminders = useMemo(() => {
    const search = searchText
      .trim()
      .toLowerCase()

    return reminderRecords.filter((reminder) => {
      if (
        statusFilter !== 'All' &&
        reminder.status !== statusFilter
      ) {
        return false
      }

      if (!search) {
        return true
      }

      const searchableText = [
        reminder.registration,
        reminder.reminder_type,
        reminder.notes,
        reminder.vehicle?.customer_name,
        reminder.vehicle?.email,
        reminder.vehicle?.phone,
        reminder.vehicle?.make,
        reminder.vehicle?.model,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(search)
    })
  }, [
    reminderRecords,
    searchText,
    statusFilter,
  ])

  const reminderCounts = useMemo(() => {
    return reminderRecords.reduce(
      (counts, reminder) => {
        if (reminder.status === 'Open') {
          counts.open += 1
        }

        if (reminder.status === 'Completed') {
          counts.completed += 1
        }

        if (reminder.overdue) {
          counts.overdue += 1
        }

        if (
          reminder.status === 'Open' &&
          reminder.daysRemaining !== null &&
          reminder.daysRemaining >= 0 &&
          reminder.daysRemaining <= 7
        ) {
          counts.nextSevenDays += 1
        }

        return counts
      },
      {
        open: 0,
        overdue: 0,
        nextSevenDays: 0,
        completed: 0,
      }
    )
  }, [reminderRecords])

  function clearMessages() {
    setErrorMessage('')
    setSuccessMessage('')
  }

  function openEditor(reminder) {
    clearMessages()

    setEditingReminder(reminder)

    setEditDueDate(
      reminder.due_date || ''
    )

    setEditDueMileage(
      reminder.due_mileage ??
        ''
    )

    setEditMileageUnit(
      reminder.due_mileage_unit || 'KM'
    )

    setEditNotes(
      reminder.notes || ''
    )
  }

  function closeEditor() {
    if (savingReminder) {
      return
    }

    setEditingReminder(null)
    setEditDueDate('')
    setEditDueMileage('')
    setEditMileageUnit('KM')
    setEditNotes('')
  }

  async function saveReminder(event) {
    event.preventDefault()

    if (!editingReminder) {
      return
    }

    clearMessages()

    if (!editDueDate && !editDueMileage) {
      setErrorMessage(
        'Enter a due date, due mileage or both.'
      )
      return
    }

    setSavingReminder(true)

    const { error } = await supabase
      .from('service_reminders')
      .update({
        due_date:
          editDueDate || null,

        due_mileage:
          editDueMileage
            ? Number(editDueMileage)
            : null,

        due_mileage_unit:
          editMileageUnit,

        notes:
          editNotes.trim() || null,
      })
      .eq('id', editingReminder.id)

    setSavingReminder(false)

    if (error) {
      setErrorMessage(
        `Unable to update reminder: ${error.message}`
      )
      return
    }

    setEditingReminder(null)

    setSuccessMessage(
      `Reminder for ${editingReminder.registration} was updated.`
    )

    await loadReminders()
  }

  async function completeReminder(reminder) {
    clearMessages()
    setProcessingReminderId(reminder.id)

    const { error } = await supabase
      .from('service_reminders')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', reminder.id)

    setProcessingReminderId(null)

    if (error) {
      setErrorMessage(
        `Unable to complete reminder: ${error.message}`
      )
      return
    }

    setSuccessMessage(
      `${reminder.registration} reminder was completed.`
    )

    await loadReminders()
  }

  async function reopenReminder(reminder) {
    clearMessages()
    setProcessingReminderId(reminder.id)

    const { error } = await supabase
      .from('service_reminders')
      .update({
        status: 'Open',
        completed_at: null,
      })
      .eq('id', reminder.id)

    setProcessingReminderId(null)

    if (error) {
      setErrorMessage(
        `Unable to reopen reminder: ${error.message}`
      )
      return
    }

    setSuccessMessage(
      `${reminder.registration} reminder was reopened.`
    )

    await loadReminders()
  }

  async function deleteReminder(reminder) {
    const confirmed = window.confirm(
      `Delete the service reminder for ${reminder.registration}?`
    )

    if (!confirmed) {
      return
    }

    clearMessages()
    setProcessingReminderId(reminder.id)

    const { error } = await supabase
      .from('service_reminders')
      .delete()
      .eq('id', reminder.id)

    setProcessingReminderId(null)

    if (error) {
      setErrorMessage(
        `Unable to delete reminder: ${error.message}`
      )
      return
    }

    setSuccessMessage(
      `${reminder.registration} reminder was deleted.`
    )

    await loadReminders()
  }

  async function handleLogout() {
    const { error } =
      await supabase.auth.signOut()

    if (error) {
      setErrorMessage(
        `Unable to log out: ${error.message}`
      )
    }
  }

  return (
    <div className="service-reminders-page">
      <header className="service-reminders-header">
        <div className="service-reminders-header-inner">
          <button
            type="button"
            onClick={backToDashboard}
          >
            Back to Dashboard
          </button>

          <div>
            <span>
              DZ Services Workshop Management
            </span>

            <h1>Service Reminder Centre</h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="service-reminders-container">
        <section className="service-reminders-heading">
          <div>
            <span className="service-reminders-eyebrow">
              Workshop Follow-up
            </span>

            <h2>Service Reminders</h2>

            <p>
              Review, edit, complete and remove service
              reminders from one place.
            </p>
          </div>

          <button
            type="button"
            className="service-reminders-primary-button"
            onClick={openVehicleSearch}
          >
            Open Vehicle Search
          </button>
        </section>

        {errorMessage && (
          <div className="service-reminders-message service-reminders-error">
            <strong>Action not completed</strong>
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="service-reminders-message service-reminders-success">
            <strong>Action completed</strong>
            <p>{successMessage}</p>
          </div>
        )}

        {editingReminder && (
          <section className="service-reminder-edit-panel">
            <div className="service-reminder-edit-heading">
              <div>
                <span className="service-reminders-eyebrow">
                  Edit Reminder
                </span>

                <h2>
                  {editingReminder.registration}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={savingReminder}
              >
                Close
              </button>
            </div>

            <form
              className="service-reminder-edit-form"
              onSubmit={saveReminder}
            >
              <div>
                <label htmlFor="reminder-due-date">
                  Due Date
                </label>

                <input
                  id="reminder-due-date"
                  type="date"
                  value={editDueDate}
                  onChange={(event) =>
                    setEditDueDate(
                      event.target.value
                    )
                  }
                  disabled={savingReminder}
                />
              </div>

              <div>
                <label htmlFor="reminder-mileage">
                  Due Mileage
                </label>

                <input
                  id="reminder-mileage"
                  type="number"
                  min="0"
                  value={editDueMileage}
                  onChange={(event) =>
                    setEditDueMileage(
                      event.target.value
                    )
                  }
                  disabled={savingReminder}
                />
              </div>

              <div>
                <label htmlFor="reminder-unit">
                  Mileage Unit
                </label>

                <select
                  id="reminder-unit"
                  value={editMileageUnit}
                  onChange={(event) =>
                    setEditMileageUnit(
                      event.target.value
                    )
                  }
                  disabled={savingReminder}
                >
                  <option value="KM">KM</option>
                  <option value="Miles">
                    Miles
                  </option>
                </select>
              </div>

              <div className="service-reminder-edit-notes">
                <label htmlFor="reminder-notes">
                  Notes
                </label>

                <textarea
                  id="reminder-notes"
                  value={editNotes}
                  onChange={(event) =>
                    setEditNotes(
                      event.target.value
                    )
                  }
                  disabled={savingReminder}
                />
              </div>

              <div className="service-reminder-edit-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeEditor}
                  disabled={savingReminder}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="service-reminders-primary-button"
                  disabled={savingReminder}
                >
                  {savingReminder
                    ? 'Saving Reminder...'
                    : 'Save Reminder'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="service-reminder-stats">
          <article>
            <span>Open</span>
            <strong>
              {loading
                ? '—'
                : reminderCounts.open}
            </strong>
          </article>

          <article className="attention">
            <span>Overdue</span>
            <strong>
              {loading
                ? '—'
                : reminderCounts.overdue}
            </strong>
          </article>

          <article>
            <span>Next 7 Days</span>
            <strong>
              {loading
                ? '—'
                : reminderCounts.nextSevenDays}
            </strong>
          </article>

          <article>
            <span>Completed</span>
            <strong>
              {loading
                ? '—'
                : reminderCounts.completed}
            </strong>
          </article>
        </section>

        <section className="service-reminders-panel">
          <div className="service-reminders-tools">
            <div>
              <label htmlFor="reminder-search">
                Search Reminders
              </label>

              <input
                id="reminder-search"
                type="text"
                placeholder="Registration, customer, email or notes"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="reminder-status">
                Status
              </label>

              <select
                id="reminder-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="Open">
                  Open
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="All">
                  All
                </option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="service-reminders-empty">
              Loading reminders...
            </div>
          )}

          {!loading &&
            filteredReminders.length === 0 && (
              <div className="service-reminders-empty">
                No reminders match the current search.
              </div>
            )}

          {!loading &&
            filteredReminders.length > 0 && (
              <div className="service-reminder-list">
                {filteredReminders.map(
                  (reminder) => (
                    <article
                      key={reminder.id}
                      className={
                        reminder.overdue
                          ? 'service-reminder-card overdue'
                          : 'service-reminder-card'
                      }
                    >
                      <div className="service-reminder-card-top">
                        <div>
                          <span>Registration</span>

                          <strong>
                            {reminder.registration}
                          </strong>
                        </div>

                        <span
                          className={
                            reminder.status ===
                            'Completed'
                              ? 'service-reminder-status completed'
                              : reminder.overdue
                                ? 'service-reminder-status overdue'
                                : 'service-reminder-status open'
                          }
                        >
                          {reminder.status ===
                          'Completed'
                            ? 'Completed'
                            : reminder.overdue
                              ? 'Overdue'
                              : 'Open'}
                        </span>
                      </div>

                      <div className="service-reminder-details">
                        <div>
                          <span>Customer</span>

                          <strong>
                            {reminder.vehicle
                              ?.customer_name ||
                              'Not recorded'}
                          </strong>
                        </div>

                        <div>
                          <span>Vehicle</span>

                          <strong>
                            {[
                              reminder.vehicle?.year,
                              reminder.vehicle?.make,
                              reminder.vehicle?.model,
                            ]
                              .filter(Boolean)
                              .join(' ') ||
                              'Not recorded'}
                          </strong>
                        </div>

                        <div>
                          <span>Due Date</span>

                          <strong>
                            {formatDate(
                              reminder.due_date
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Due Mileage</span>

                          <strong>
                            {formatMileage(
                              reminder.due_mileage,
                              reminder.due_mileage_unit
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Timing</span>

                          <strong>
  {reminder.daysRemaining === null
    ? 'Date not set'
    : reminder.daysRemaining < 0
      ? `${Math.abs(
          reminder.daysRemaining
        )} days overdue`
      : reminder.daysRemaining === 0
        ? 'Due today'
        : `${reminder.daysRemaining} days remaining`}
</strong>
                        </div>
                      </div>

                      {reminder.notes && (
                        <p className="service-reminder-notes">
                          {reminder.notes}
                        </p>
                      )}

                      <footer className="service-reminder-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openEditor(reminder)
                          }
                        >
                          Edit
                        </button>

                        {reminder.status ===
                        'Open' ? (
                          <button
                            type="button"
                            className="service-reminder-complete-button"
                            onClick={() =>
                              completeReminder(
                                reminder
                              )
                            }
                            disabled={
                              processingReminderId ===
                              reminder.id
                            }
                          >
                            {processingReminderId ===
                            reminder.id
                              ? 'Saving...'
                              : 'Mark Complete'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              reopenReminder(
                                reminder
                              )
                            }
                            disabled={
                              processingReminderId ===
                              reminder.id
                            }
                          >
                            {processingReminderId ===
                            reminder.id
                              ? 'Saving...'
                              : 'Reopen'}
                          </button>
                        )}

                        <button
                          type="button"
                          className="danger-outline-button"
                          onClick={() =>
                            deleteReminder(reminder)
                          }
                          disabled={
                            processingReminderId ===
                            reminder.id
                          }
                        >
                          Delete
                        </button>
                      </footer>
                    </article>
                  )
                )}
              </div>
            )}
        </section>
      </main>
    </div>
  )
}