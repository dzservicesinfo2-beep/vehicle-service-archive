import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({
  openVehicleSearch,
  openNewVehicle,
}) {
  const [vehicleCount, setVehicleCount] = useState(0)
  const [customerCount, setCustomerCount] = useState(0)
  const [serviceCount, setServiceCount] = useState(0)
  const [reminders, setReminders] = useState([])
  const [latestVehicleVisits, setLatestVehicleVisits] =
    useState([])
  const [recentVisits, setRecentVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [completingReminderId, setCompletingReminderId] =
    useState(null)

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)

      const [
        vehiclesResult,
        customersResult,
        servicesResult,
        remindersResult,
        visitDetailsResult,
      ] = await Promise.all([
        supabase
          .from('vehicles')
          .select('*', {
            count: 'exact',
            head: true,
          }),

        supabase
          .from('vehicles')
          .select('customer_name'),

        supabase
          .from('service_visits')
          .select('*', {
            count: 'exact',
            head: true,
          }),

        supabase
          .from('service_reminders')
          .select('*')
          .eq('status', 'Open')
          .order('due_date', {
            ascending: true,
            nullsFirst: false,
          }),

        supabase
          .from('service_visits')
          .select(
            `
              id,
              registration,
              service_date,
              job_status,
              technician_name,
              mileage,
              mileage_unit,
              completion_summary
            `
          )
          .order('service_date', { ascending: false })
          .order('id', { ascending: false }),
      ])

      const errors = [
        vehiclesResult.error,
        customersResult.error,
        servicesResult.error,
        remindersResult.error,
        visitDetailsResult.error,
      ].filter(Boolean)

      if (errors.length > 0) {
        console.error(
          'Dashboard loading errors:',
          errors
        )

        alert(
          `Some dashboard information could not be loaded: ${errors[0].message}`
        )
      }

      const uniqueCustomers = new Set(
        (customersResult.data || [])
          .map((vehicle) =>
            vehicle.customer_name
              ?.trim()
              .toLowerCase()
          )
          .filter(Boolean)
      )

      const allVisits = visitDetailsResult.data || []
      const latestByRegistration = new Map()

      allVisits.forEach((visit) => {
        if (
          visit.registration &&
          !latestByRegistration.has(visit.registration)
        ) {
          latestByRegistration.set(
            visit.registration,
            visit
          )
        }
      })

      setVehicleCount(vehiclesResult.count || 0)
      setCustomerCount(uniqueCustomers.size)
      setServiceCount(servicesResult.count || 0)
      setReminders(remindersResult.data || [])
      setLatestVehicleVisits([
        ...latestByRegistration.values(),
      ])
      setRecentVisits(allVisits.slice(0, 6))
      setLoading(false)
    }

    loadDashboard()
  }, [])

  const workshopCounts = useMemo(() => {
    return latestVehicleVisits.reduce(
      (counts, visit) => {
        const status =
          visit.job_status || 'Status Not Recorded'

        if (status === 'In Progress') {
          counts.inProgress += 1
        }

        if (status === 'Waiting for Parts') {
          counts.waitingForParts += 1
        }

        if (status === 'Waiting for Inspection') {
          counts.waitingForInspection += 1
        }

        if (
          status === 'Ready for Collection' ||
          status === 'Ready'
        ) {
          counts.readyForCollection += 1
        }

        return counts
      },
      {
        inProgress: 0,
        waitingForParts: 0,
        waitingForInspection: 0,
        readyForCollection: 0,
      }
    )
  }, [latestVehicleVisits])

  const reminderCounts = useMemo(() => {
    return reminders.reduce(
      (counts, reminder) => {
        if (isReminderOverdue(reminder.due_date)) {
          counts.overdue += 1
        } else {
          counts.upcoming += 1
        }

        return counts
      },
      {
        overdue: 0,
        upcoming: 0,
      }
    )
  }, [reminders])

  async function completeReminder(reminderId) {
    setCompletingReminderId(reminderId)

    const { error } = await supabase
      .from('service_reminders')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', reminderId)

    setCompletingReminderId(null)

    if (error) {
      alert(
        `Unable to complete reminder: ${error.message}`
      )

      return
    }

    setReminders((currentReminders) =>
      currentReminders.filter(
        (reminder) => reminder.id !== reminderId
      )
    )
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(`Unable to log out: ${error.message}`)
    }
  }

  function isReminderOverdue(dueDate) {
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

  function formatDate(dateValue) {
    if (!dateValue) {
      return 'Not set'
    }

    return new Date(
      `${dateValue}T00:00:00`
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
      return 'Not recorded'
    }

    const numericValue = Number(value)

    const formattedValue = Number.isNaN(numericValue)
      ? value
      : numericValue.toLocaleString('en-IE')

    return `${formattedValue} ${unit || 'KM'}`
  }

  function getStatusClass(status) {
    if (status === 'Completed') {
      return 'dashboard-status dashboard-status-completed'
    }

    if (
      status === 'Waiting for Parts' ||
      status === 'Waiting for Inspection'
    ) {
      return 'dashboard-status dashboard-status-warning'
    }

    if (
      status === 'Ready for Collection' ||
      status === 'Ready'
    ) {
      return 'dashboard-status dashboard-status-ready'
    }

    if (status === 'In Progress') {
      return 'dashboard-status dashboard-status-progress'
    }

    return 'dashboard-status'
  }

  return (
    <main className="workshop-dashboard">
      <div className="workshop-dashboard-container">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">
              DZ Services Workshop Management
            </span>

            <h1>Vehicle Service Archive</h1>

            <p>
              Workshop activity, vehicle records and service
              reminders in one place.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        <section className="dashboard-hero">
          <div>
            <span className="dashboard-hero-label">
              Workshop Overview
            </span>

            <h2>Good to see you.</h2>

            <p>
              Review current workshop activity or open a
              vehicle record to continue working.
            </p>
          </div>

          <div className="dashboard-hero-actions">
            <button
              type="button"
              className="dashboard-primary-action"
              onClick={openVehicleSearch}
            >
              Open Vehicle Search
            </button>

            <button
              type="button"
              className="dashboard-secondary-action"
              onClick={openNewVehicle}
            >
              Add New Vehicle
            </button>
          </div>
        </section>

        <section className="dashboard-stat-grid">
          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon">V</span>

            <div>
              <span>Total Vehicles</span>

              <strong>
                {loading ? '—' : vehicleCount}
              </strong>

              <small>Stored vehicle records</small>
            </div>
          </article>

          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon">C</span>

            <div>
              <span>Total Customers</span>

              <strong>
                {loading ? '—' : customerCount}
              </strong>

              <small>Unique customer records</small>
            </div>
          </article>

          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon">S</span>

            <div>
              <span>Service Visits</span>

              <strong>
                {loading ? '—' : serviceCount}
              </strong>

              <small>All recorded workshop visits</small>
            </div>
          </article>

          <article className="dashboard-stat-card dashboard-stat-attention">
            <span className="dashboard-stat-icon">!</span>

            <div>
              <span>Overdue Reminders</span>

              <strong>
                {loading
                  ? '—'
                  : reminderCounts.overdue}
              </strong>

              <small>Require attention</small>
            </div>
          </article>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-eyebrow">
                Current Activity
              </span>

              <h2>Workshop Status</h2>

              <p>
                Status is based on each vehicle’s latest
                recorded service visit.
              </p>
            </div>
          </div>

          <div className="dashboard-workshop-grid">
            <article className="dashboard-workshop-card">
              <div className="dashboard-workshop-card-top">
                <span>In Progress</span>

                <strong>
                  {loading
                    ? '—'
                    : workshopCounts.inProgress}
                </strong>
              </div>

              <p>Vehicles currently being worked on.</p>
            </article>

            <article className="dashboard-workshop-card">
              <div className="dashboard-workshop-card-top">
                <span>Waiting for Parts</span>

                <strong>
                  {loading
                    ? '—'
                    : workshopCounts.waitingForParts}
                </strong>
              </div>

              <p>Jobs paused until required parts arrive.</p>
            </article>

            <article className="dashboard-workshop-card">
              <div className="dashboard-workshop-card-top">
                <span>Waiting for Inspection</span>

                <strong>
                  {loading
                    ? '—'
                    : workshopCounts.waitingForInspection}
                </strong>
              </div>

              <p>Vehicles awaiting checks or approval.</p>
            </article>

            <article className="dashboard-workshop-card">
              <div className="dashboard-workshop-card-top">
                <span>Ready for Collection</span>

                <strong>
                  {loading
                    ? '—'
                    : workshopCounts.readyForCollection}
                </strong>
              </div>

              <p>Completed vehicles ready for customers.</p>
            </article>
          </div>
        </section>

        <div className="dashboard-content-grid">
          <section className="dashboard-panel">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-eyebrow">
                  Follow-up
                </span>

                <h2>Service Reminders</h2>

                <p>
                  Upcoming and overdue customer service
                  requirements.
                </p>
              </div>

              {!loading && (
                <span className="dashboard-count-badge">
                  {reminders.length} open
                </span>
              )}
            </div>

            {loading && (
              <div className="dashboard-empty-state">
                Loading service reminders...
              </div>
            )}

            {!loading && reminders.length === 0 && (
              <div className="dashboard-empty-state">
                <strong>No open reminders</strong>

                <p>
                  All service reminders are currently up to
                  date.
                </p>
              </div>
            )}

            {!loading &&
              reminders.slice(0, 6).map((reminder) => {
                const overdue = isReminderOverdue(
                  reminder.due_date
                )

                return (
                  <article
                    key={reminder.id}
                    className={
                      overdue
                        ? 'dashboard-reminder dashboard-reminder-overdue'
                        : 'dashboard-reminder'
                    }
                  >
                    <div className="dashboard-reminder-main">
                      <div className="dashboard-reminder-title">
                        <strong>
                          {reminder.registration}
                        </strong>

                        <span
                          className={
                            overdue
                              ? 'dashboard-reminder-label overdue'
                              : 'dashboard-reminder-label'
                          }
                        >
                          {overdue
                            ? 'Overdue'
                            : 'Upcoming'}
                        </span>
                      </div>

                      <div className="dashboard-reminder-details">
                        <span>
                          <small>Due date</small>

                          <strong>
                            {formatDate(
                              reminder.due_date
                            )}
                          </strong>
                        </span>

                        <span>
                          <small>Due mileage</small>

                          <strong>
                            {reminder.due_mileage != null
                              ? Number(
                                  reminder.due_mileage
                                ).toLocaleString(
                                  'en-IE'
                                )
                              : 'Not set'}
                          </strong>
                        </span>
                      </div>

                      {reminder.notes && (
                        <p>{reminder.notes}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      className="dashboard-complete-button"
                      onClick={() =>
                        completeReminder(reminder.id)
                      }
                      disabled={
                        completingReminderId ===
                        reminder.id
                      }
                    >
                      {completingReminderId ===
                      reminder.id
                        ? 'Saving...'
                        : 'Mark Complete'}
                    </button>
                  </article>
                )
              })}
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-eyebrow">
                  Latest Records
                </span>

                <h2>Recent Service Visits</h2>

                <p>
                  Most recently added workshop records.
                </p>
              </div>
            </div>

            {loading && (
              <div className="dashboard-empty-state">
                Loading recent visits...
              </div>
            )}

            {!loading && recentVisits.length === 0 && (
              <div className="dashboard-empty-state">
                <strong>No service visits yet</strong>

                <p>
                  Recent workshop jobs will appear here.
                </p>
              </div>
            )}

            {!loading &&
              recentVisits.map((visit) => (
                <article
                  key={visit.id}
                  className="dashboard-recent-visit"
                >
                  <div className="dashboard-recent-visit-top">
                    <div>
                      <strong>
                        {visit.registration ||
                          'No registration'}
                      </strong>

                      <span>
                        {formatDate(
                          visit.service_date
                        )}
                      </span>
                    </div>

                    <span
                      className={getStatusClass(
                        visit.job_status
                      )}
                    >
                      {visit.job_status ||
                        'Status not recorded'}
                    </span>
                  </div>

                  <div className="dashboard-recent-visit-meta">
                    <span>
                      <small>Technician</small>

                      <strong>
                        {visit.technician_name ||
                          'Not recorded'}
                      </strong>
                    </span>

                    <span>
                      <small>Mileage</small>

                      <strong>
                        {formatMileage(
                          visit.mileage,
                          visit.mileage_unit
                        )}
                      </strong>
                    </span>
                  </div>

                  {visit.completion_summary && (
                    <p>{visit.completion_summary}</p>
                  )}
                </article>
              ))}

            {!loading && recentVisits.length > 0 && (
              <button
                type="button"
                className="dashboard-panel-action"
                onClick={openVehicleSearch}
              >
                Search All Vehicles
              </button>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}