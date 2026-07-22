import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function cleanText(value, fallback = 'Not recorded') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function formatDate(value) {
  if (!value) {
    return 'Not recorded'
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function CustomerDashboard() {
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [serviceVisits, setServiceVisits] = useState([])
  const [expandedVehicle, setExpandedVehicle] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadCustomerPortal() {
      setLoading(true)
      setErrorMessage('')

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!user?.email) {
          throw new Error(
            'Your customer account could not be identified.'
          )
        }

        const email = user.email.trim().toLowerCase()

        setCustomerEmail(email)

        const { data: customerVehicles, error: vehiclesError } =
          await supabase
            .from('vehicles')
.select(`
    registration,
    customer_name,
    email,
    phone,
    make,
    model,
    year,
    vin
`)
            .ilike('email', email)
            .order('registration', {
              ascending: true,
            })

        if (vehiclesError) {
          throw vehiclesError
        }

        const vehicleRecords = customerVehicles || []

        setVehicles(vehicleRecords)

        const firstCustomerName =
          vehicleRecords.find(
            (vehicle) =>
              vehicle.customer_name?.trim()
          )?.customer_name || ''

        setCustomerName(firstCustomerName)

        const registrations = vehicleRecords
          .map((vehicle) => vehicle.registration)
          .filter(Boolean)

        if (registrations.length === 0) {
          setServiceVisits([])
          return
        }

        const { data: visits, error: visitsError } =
          await supabase
            .from('service_visits')
            .select(
              `
                id,
                registration,
                service_date,
                repairs_report,
                repair_parts,
                completion_summary
              `
            )
            .in('registration', registrations)
            .order('service_date', {
              ascending: false,
            })

        if (visitsError) {
          throw visitsError
        }

        setServiceVisits(visits || [])
      } catch (error) {
        setErrorMessage(
          error?.message ||
            'The customer portal could not be loaded.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadCustomerPortal()
  }, [])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setErrorMessage(
        `Unable to log out: ${error.message}`
      )
    }
  }

  function getVehicleVisits(registration) {
    return serviceVisits.filter(
      (visit) => visit.registration === registration
    )
  }

  function getLatestVisit(registration) {
    return getVehicleVisits(registration)[0] || null
  }

  function toggleVehicle(registration) {
    setExpandedVehicle((currentRegistration) =>
      currentRegistration === registration
        ? null
        : registration
    )
  }

  const totalServiceVisits = serviceVisits.length

  const latestServiceVisit =
    serviceVisits.length > 0
      ? serviceVisits[0]
      : null

  return (
    <div className="customer-portal">
      <header className="customer-portal-header">
        <div className="customer-portal-header-inner">
          <div>
            <div className="customer-portal-brand">
              DZ SERVICES
            </div>

            <div className="customer-portal-subtitle">
              Customer Vehicle Portal
            </div>
          </div>

          <button
            type="button"
            className="customer-portal-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="customer-portal-main">
        {loading && (
          <section className="customer-portal-loading">
            <div className="customer-portal-spinner" />

            <h1>Loading your vehicle records</h1>

            <p>
              Please wait while we securely retrieve your
              information.
            </p>
          </section>
        )}

        {!loading && errorMessage && (
          <section
            className="customer-portal-message customer-portal-message-error"
            role="alert"
          >
            <div className="customer-portal-message-icon">
              !
            </div>

            <div>
              <h2>Unable to load the portal</h2>
              <p>{errorMessage}</p>
            </div>
          </section>
        )}

        {!loading && !errorMessage && (
          <>
            <section className="customer-portal-welcome">
              <div>
                <span className="customer-portal-eyebrow">
                  Secure customer access
                </span>

                <h1>
                  Welcome
                  {customerName
                    ? `, ${customerName}`
                    : ''}
                </h1>

                <p>
                  View your registered vehicles and their
                  completed service records with DZ Services.
                </p>
              </div>

              <div className="customer-portal-account">
                <span>Signed in as</span>
                <strong>{customerEmail}</strong>
              </div>
            </section>

            <section className="customer-portal-stats">
              <article className="customer-portal-stat">
                <span>Registered Vehicles</span>
                <strong>{vehicles.length}</strong>
                <p>
                  Vehicles connected to your account
                </p>
              </article>

              <article className="customer-portal-stat">
                <span>Service Records</span>
                <strong>{totalServiceVisits}</strong>
                <p>
                  Completed visits currently available
                </p>
              </article>

              <article className="customer-portal-stat">
                <span>Latest Service</span>
                <strong className="customer-portal-stat-date">
                  {latestServiceVisit
                    ? formatDate(
                        latestServiceVisit.service_date
                      )
                    : 'None recorded'}
                </strong>
                <p>
                  Most recent workshop record
                </p>
              </article>
            </section>

            <section className="customer-portal-section">
              <div className="customer-portal-section-heading">
                <div>
                  <span className="customer-portal-eyebrow">
                    Your fleet
                  </span>

                  <h2>Your Vehicles</h2>

                  <p>
                    Select a vehicle to view its latest service
                    information and complete service history.
                  </p>
                </div>
              </div>

              {vehicles.length === 0 && (
                <div className="customer-portal-empty">
                  <div className="customer-portal-empty-icon">
                    DZ
                  </div>

                  <h3>No vehicles are linked to this account</h3>

                  <p>
                    Your login email does not currently match
                    an email address stored against a vehicle
                    record.
                  </p>

                  <div className="customer-portal-empty-email">
                    Account email: {customerEmail}
                  </div>
                </div>
              )}

              {vehicles.length > 0 && (
                <div className="customer-vehicle-list">
                  {vehicles.map((vehicle) => {
                    const vehicleVisits =
                      getVehicleVisits(
                        vehicle.registration
                      )

                    const latestVisit =
                      getLatestVisit(
                        vehicle.registration
                      )

                    const expanded =
                      expandedVehicle ===
                      vehicle.registration

                    return (
                      <article
                        key={vehicle.registration}
                        className={
                          expanded
                            ? 'customer-vehicle-card customer-vehicle-card-expanded'
                            : 'customer-vehicle-card'
                        }
                      >
                        <div className="customer-vehicle-card-top">
                          <div className="customer-vehicle-registration">
                            <span>Registration</span>

                            <strong>
                              {cleanText(
                                vehicle.registration
                              )}
                            </strong>
                          </div>

                          <div className="customer-vehicle-summary">
                            <h3>
                              {cleanText(
                                `${vehicle.make || ''} ${
                                  vehicle.model || ''
                                }`.trim(),
                                'Vehicle details'
                              )}
                            </h3>

                            <p>
                              {vehicle.year
                                ? `Year ${vehicle.year}`
                                : 'Year not recorded'}
                            </p>
                          </div>

                          <div className="customer-vehicle-service-status">
                            <span>Service records</span>

                            <strong>
                              {vehicleVisits.length}
                            </strong>
                          </div>

                          <button
                            type="button"
                            className="customer-vehicle-open-button"
                            onClick={() =>
                              toggleVehicle(
                                vehicle.registration
                              )
                            }
                            aria-expanded={expanded}
                          >
                            {expanded
                              ? 'Close Record'
                              : 'View Record'}
                          </button>
                        </div>

                        <div className="customer-vehicle-meta">
                          <div>
                            <span>Latest service</span>

                            <strong>
                              {latestVisit
                                ? formatDate(
                                    latestVisit.service_date
                                  )
                                : 'No service recorded'}
                            </strong>
                          </div>

                          <div>
                            <span>VIN</span>

                            <strong>
                              {cleanText(vehicle.vin)}
                            </strong>
                          </div>
                        </div>

                        {expanded && (
                          <div className="customer-vehicle-record">
                            <section className="customer-vehicle-details-grid">
                              <div>
                                <span>Registration</span>
                                <strong>
                                  {cleanText(
                                    vehicle.registration
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>Make</span>
                                <strong>
                                  {cleanText(vehicle.make)}
                                </strong>
                              </div>

                              <div>
                                <span>Model</span>
                                <strong>
                                  {cleanText(vehicle.model)}
                                </strong>
                              </div>

                              <div>
                                <span>Year</span>
                                <strong>
                                  {cleanText(vehicle.year)}
                                </strong>
                              </div>

                              <div className="customer-vehicle-detail-wide">
                                <span>VIN</span>
                                <strong>
                                  {cleanText(vehicle.vin)}
                                </strong>
                              </div>
                            </section>

                            <section className="customer-service-history">
                              <div className="customer-service-history-heading">
                                <div>
                                  <span>
                                    Maintenance records
                                  </span>

                                  <h4>Service History</h4>
                                </div>

                                <strong>
                                  {vehicleVisits.length}{' '}
                                  {vehicleVisits.length === 1
                                    ? 'record'
                                    : 'records'}
                                </strong>
                              </div>

                              {vehicleVisits.length === 0 && (
                                <div className="customer-service-empty">
                                  No completed service records
                                  are currently available for
                                  this vehicle.
                                </div>
                              )}

                              {vehicleVisits.map(
                                (visit, index) => (
                                  <article
                                    key={visit.id}
                                    className="customer-service-card"
                                  >
                                    <div className="customer-service-card-header">
                                      <div>
                                        <span>
                                          Service visit{' '}
                                          {vehicleVisits.length -
                                            index}
                                        </span>

                                        <h5>
                                          {formatDate(
                                            visit.service_date
                                          )}
                                        </h5>
                                      </div>

                                      {index === 0 && (
                                        <span className="customer-service-latest">
                                          Latest
                                        </span>
                                      )}
                                    </div>

                                    <div className="customer-service-content">
                                      <div>
                                        <span>
                                          Work carried out
                                        </span>

                                        <p>
                                          {cleanText(
                                            visit.repairs_report
                                          )}
                                        </p>
                                      </div>

                                      <div>
                                        <span>Parts used</span>

                                        <p>
                                          {cleanText(
                                            visit.repair_parts
                                          )}
                                        </p>
                                      </div>

                                      <div className="customer-service-summary">
                                        <span>
                                          Completion summary
                                        </span>

                                        <p>
                                          {cleanText(
                                            visit.completion_summary
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </article>
                                )
                              )}
                            </section>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="customer-portal-support">
              <div>
                <span className="customer-portal-eyebrow">
                  Need assistance?
                </span>

                <h2>Contact DZ Services</h2>

                <p>
                  Contact the workshop if vehicle information
                  is missing or needs to be updated.
                </p>
              </div>

              <div className="customer-portal-support-badge">
                Van &amp; Light Commercial Repairs
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}