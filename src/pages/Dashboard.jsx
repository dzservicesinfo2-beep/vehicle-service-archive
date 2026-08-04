import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'

function formatDate(value) {
  if (!value) {
    return 'Not recorded'
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-IE', {
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

  const number = Number(value)

  const formatted = Number.isNaN(number)
    ? value
    : number.toLocaleString('en-IE')

  return `${formatted} ${unit || 'KM'}`
}

function isOverdue(dueDate) {
  if (!dueDate) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(`${dueDate}T00:00:00`)

  return due < today
}

function isDueToday(dueDate) {
  if (!dueDate) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(`${dueDate}T00:00:00`)

  return due.getTime() === today.getTime()
}

function isServiceToday(serviceDate) {
  if (!serviceDate) {
    return false
  }

  const today = new Date()
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  return serviceDate === localToday
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

  if (
    status === 'Work in Progress' ||
    status === 'In Progress'
  ) {
    return 'dashboard-status dashboard-status-progress'
  }

  return 'dashboard-status'
}

export default function Dashboard({
  openVehicleSearch,
  openNewVehicle,
  openCustomerManagement,
  openServiceReminders,
  isAdmin = false,
}) {
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [visits, setVisits] = useState([])
  const [reminders, setReminders] = useState([])

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    const [
      vehiclesResult,
      customersResult,
      visitsResult,
      remindersResult,
    ] = await Promise.all([
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
            year,
            created_at
          `
        )
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('profiles')
        .select(
          `
            id,
            email,
            full_name,
            active,
            created_at
          `
        )
        .eq('role', 'customer')
        .order('created_at', {
          ascending: false,
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
        .order('service_date', {
          ascending: false,
        })
        .order('id', {
          ascending: false,
        }),

      supabase
        .from('service_reminders')
        .select('*')
        .eq('status', 'Open')
        .order('due_date', {
          ascending: true,
          nullsFirst: false,
        }),
    ])

    const firstError =
      vehiclesResult.error ||
      customersResult.error ||
      visitsResult.error ||
      remindersResult.error

    if (firstError) {
      setErrorMessage(
        `Some dashboard information could not be loaded: ${firstError.message}`
      )
    }

    setVehicles(vehiclesResult.data || [])
    setCustomers(customersResult.data || [])
    setVisits(visitsResult.data || [])
    setReminders(remindersResult.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadDashboard()

    const refreshInterval = window.setInterval(() => {
      loadDashboard()
    }, 30000)

    return () => {
      window.clearInterval(refreshInterval)
    }
  }, [loadDashboard])

  const vehicleMap = useMemo(() => {
    return new Map(
      vehicles.map((vehicle) => [
        vehicle.registration,
        vehicle,
      ])
    )
  }, [vehicles])

  const latestVehicleVisits = useMemo(() => {
    const latestByRegistration = new Map()

    visits.forEach((visit) => {
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

    return [...latestByRegistration.values()]
  }, [visits])

  const todayJobs = useMemo(() => {
    return visits.filter((visit) =>
      isServiceToday(visit.service_date)
    )
  }, [visits])

  const workshopCounts = useMemo(() => {
    return latestVehicleVisits.reduce(
      (counts, visit) => {
        const status = visit.job_status || ''

        if (
          status === 'Work in Progress' ||
          status === 'In Progress'
        ) {
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
        if (isOverdue(reminder.due_date)) {
          counts.overdue += 1
        }

        if (isDueToday(reminder.due_date)) {
          counts.today += 1
        }

        return counts
      },
      {
        overdue: 0,
        today: 0,
      }
    )
  }, [reminders])

  const recentVehicles = vehicles.slice(0, 10)
  const recentCustomers = customers.slice(0, 10)

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setErrorMessage(
        `Unable to log out: ${error.message}`
      )
    }
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
              Workshop activity, vehicles, customers and
              service reminders in one place.
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

        {errorMessage && (
          <div
            className="dashboard-error-message"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <section className="dashboard-hero">
          <div>
            <span className="dashboard-hero-label">
              Workshop Overview
            </span>

            <h2>Good to see you.</h2>

            <p>
              Open a vehicle record, register a new vehicle
              or manage workshop follow-up.
            </p>
          </div>

          <div className="dashboard-hero-actions">
            <button
              type="button"
              className="dashboard-primary-action"
              onClick={openVehicleSearch}
            >
              Vehicle Search
            </button>

            <button
              type="button"
              className="dashboard-secondary-action"
              onClick={openNewVehicle}
            >
              Add New Vehicle
            </button>

            {isAdmin && (
              <button
                type="button"
                className="dashboard-secondary-action"
                onClick={openCustomerManagement}
              >
                Customer Management
              </button>
            )}

            <button
              type="button"
              className="dashboard-secondary-action"
              onClick={openServiceReminders}
            >
              Service Reminders
            </button>
          </div>
        </section>

        <section className="dashboard-stat-grid">
          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon">T</span>

            <div>
              <span>Today's Jobs</span>

              <strong>
                {loading ? '—' : todayJobs.length}
              </strong>

              <small>Visits dated today</small>
            </div>
          </article>

          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon">P</span>

            <div>
              <span>Waiting for Parts</span>

              <strong>
                {loading
                  ? '—'
                  : workshopCounts.waitingForParts}
              </strong>

              <small>Paused workshop jobs</small>
            </div>
          </article>

          <article className="dashboard-stat-card">
            <span className="dashboard-stat-icon">R</span>

            <div>
              <span>Ready for Collection</span>

              <strong>
                {loading
                  ? '—'
                  : workshopCounts.readyForCollection}
              </strong>

              <small>Completed vehicles</small>
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
                service visit.
              </p>
            </div>
          </div>

          <div className="dashboard-workshop-grid">
            <article className="dashboard-workshop-card">
              <div className="dashboard-workshop-card-top">
                <span>Work in Progress</span>

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

              <p>Jobs paused until parts arrive.</p>
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

              <p>Finished vehicles ready for customers.</p>
            </article>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-eyebrow">
                Today
              </span>

              <h2>Today's Schedule</h2>

              <p>
                Service visits recorded for today.
              </p>
            </div>

            <span className="dashboard-count-badge">
              {todayJobs.length}
            </span>
          </div>

          {loading && (
            <div className="dashboard-empty-state">
              Loading today's jobs...
            </div>
          )}

          {!loading && todayJobs.length === 0 && (
            <div className="dashboard-empty-state">
              <strong>No jobs recorded today</strong>

              <p>
                New service visits dated today will appear
                here.
              </p>
            </div>
          )}

          {!loading &&
            todayJobs.length > 0 && (
              <div className="dashboard-today-grid">
                {todayJobs.map((visit) => {
                  const vehicle = vehicleMap.get(
                    visit.registration
                  )

                  return (
                    <article
                      key={visit.id}
                      className="dashboard-today-job"
                    >
                      <div className="dashboard-recent-visit-top">
                        <div>
                          <strong>
                            {visit.registration}
                          </strong>

                          <span>
                            {vehicle?.customer_name ||
                              'Customer not recorded'}
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
                          <small>Vehicle</small>

                          <strong>
                            {[
                              vehicle?.year,
                              vehicle?.make,
                              vehicle?.model,
                            ]
                              .filter(Boolean)
                              .join(' ') ||
                              'Not recorded'}
                          </strong>
                        </span>

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
                    </article>
                  )
                })}
              </div>
            )}
        </section>

        <div className="dashboard-priority-three-grid">
          <section className="dashboard-panel">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-eyebrow">
                  Recently Added
                </span>

                <h2>Vehicles</h2>

                <p>Latest vehicle records.</p>
              </div>

              <span className="dashboard-count-badge">
                {vehicles.length}
              </span>
            </div>

            {loading && (
              <div className="dashboard-empty-state">
                Loading vehicles...
              </div>
            )}

            {!loading &&
              recentVehicles.length === 0 && (
                <div className="dashboard-empty-state">
                  No vehicles have been added.
                </div>
              )}

            {!loading &&
              recentVehicles.map((vehicle) => (
                <article
                  key={vehicle.registration}
                  className="dashboard-recent-record"
                >
                  <div>
                    <strong>
                      {vehicle.registration}
                    </strong>

                    <span>
                      {[
                        vehicle.year,
                        vehicle.make,
                        vehicle.model,
                      ]
                        .filter(Boolean)
                        .join(' ') ||
                        'Vehicle details not recorded'}
                    </span>
                  </div>

                  <small>
                    {vehicle.customer_name ||
                      'Customer not recorded'}
                  </small>
                </article>
              ))}

            <button
              type="button"
              className="dashboard-panel-action"
              onClick={openVehicleSearch}
            >
              Open Vehicle Search
            </button>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-eyebrow">
                  Recently Added
                </span>

                <h2>Customers</h2>

                <p>Latest portal accounts.</p>
              </div>

              <span className="dashboard-count-badge">
                {customers.length}
              </span>
            </div>

            {loading && (
              <div className="dashboard-empty-state">
                Loading customers...
              </div>
            )}

            {!loading &&
              recentCustomers.length === 0 && (
                <div className="dashboard-empty-state">
                  No customer portal accounts found.
                </div>
              )}

            {!loading &&
              recentCustomers.map((customer) => (
                <article
                  key={customer.id}
                  className="dashboard-recent-record"
                >
                  <div>
                    <strong>
                      {customer.full_name ||
                        'Customer name not recorded'}
                    </strong>

                    <span>
                      {customer.email ||
                        'Email not recorded'}
                    </span>
                  </div>

                  <small>
                    {customer.active
                      ? 'Active'
                      : 'Inactive'}
                  </small>
                </article>
              ))}

            {isAdmin && (
              <button
                type="button"
                className="dashboard-panel-action"
                onClick={openCustomerManagement}
              >
                Open Customer Management
              </button>
            )}
          </section>
        </div>

        <section className="dashboard-section dashboard-reminder-summary">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-eyebrow">
                Follow-up
              </span>

              <h2>Service Reminder Summary</h2>

              <p>
                Overdue and due-today reminders.
              </p>
            </div>

            <span className="dashboard-count-badge">
              {reminderCounts.overdue +
                reminderCounts.today}
            </span>
          </div>

          <div className="dashboard-reminder-summary-grid">
            <article>
              <span>Due Today</span>

              <strong>
                {loading
                  ? '—'
                  : reminderCounts.today}
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
          </div>

          <button
            type="button"
            className="dashboard-panel-action"
            onClick={openServiceReminders}
          >
            Open Service Reminder Centre
          </button>
        </section>
      </div>
    </main>
  )
}