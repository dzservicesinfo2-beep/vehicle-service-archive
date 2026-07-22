import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import VehicleProfile from './VehicleProfile'

export default function VehicleSearch({
  backToDashboard,
}) {
  const [searchText, setSearchText] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] =
    useState(null)
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    const cleanedSearch = searchText.trim()

    if (!cleanedSearch) {
      setVehicles([])
      setHasSearched(false)
      setSearchError('')
      return
    }

    const searchTimer = window.setTimeout(() => {
      searchVehicles(cleanedSearch)
    }, 450)

    return () => window.clearTimeout(searchTimer)
  }, [searchText])

  async function searchVehicles(
    suppliedSearchText = searchText.trim()
  ) {
    const cleanedSearch = suppliedSearchText.trim()

    if (!cleanedSearch) {
      setVehicles([])
      setSelectedVehicle(null)
      setHasSearched(false)
      setSearchError('')
      return
    }

    setSearching(true)
    setSelectedVehicle(null)
    setSearchError('')

    const safeSearchText = cleanedSearch.replace(
      /[,().%]/g,
      ' '
    )

    const { data: vehicleData, error: vehicleError } =
      await supabase
        .from('vehicles')
        .select('*')
        .or(
          `registration.ilike.%${safeSearchText}%,customer_name.ilike.%${safeSearchText}%,phone.ilike.%${safeSearchText}%,make.ilike.%${safeSearchText}%,model.ilike.%${safeSearchText}%,vin.ilike.%${safeSearchText}%`
        )
        .order('registration', { ascending: true })

    if (vehicleError) {
      setSearching(false)
      setHasSearched(true)
      setVehicles([])
      setSearchError(vehicleError.message)
      return
    }

    const matchedVehicles = vehicleData || []

    if (matchedVehicles.length === 0) {
      setVehicles([])
      setSearching(false)
      setHasSearched(true)
      return
    }

    const registrations = matchedVehicles
      .map((vehicle) => vehicle.registration)
      .filter(Boolean)

    const [visitsResult, filesResult] =
      await Promise.all([
        supabase
          .from('service_visits')
          .select(
            `
              id,
              registration,
              service_date,
              job_status,
              mileage,
              mileage_unit
            `
          )
          .in('registration', registrations)
          .order('service_date', {
            ascending: false,
          })
          .order('id', {
            ascending: false,
          }),

        supabase
          .from('vehicle_files')
          .select('id, registration')
          .in('registration', registrations),
      ])

    if (visitsResult.error) {
      console.error(
        'Unable to load service visit details:',
        visitsResult.error
      )
    }

    if (filesResult.error) {
      console.error(
        'Unable to load vehicle file totals:',
        filesResult.error
      )
    }

    const visitSummary = new Map()
    const fileTotals = new Map()

    ;(visitsResult.data || []).forEach((visit) => {
      const currentSummary =
        visitSummary.get(visit.registration) || {
          count: 0,
          latestVisit: null,
        }

      currentSummary.count += 1

      if (!currentSummary.latestVisit) {
        currentSummary.latestVisit = visit
      }

      visitSummary.set(
        visit.registration,
        currentSummary
      )
    })

    ;(filesResult.data || []).forEach((file) => {
      const currentTotal =
        fileTotals.get(file.registration) || 0

      fileTotals.set(
        file.registration,
        currentTotal + 1
      )
    })

    const enrichedVehicles = matchedVehicles.map(
      (vehicle) => {
        const summary = visitSummary.get(
          vehicle.registration
        )

        return {
          ...vehicle,
          service_visit_count: summary?.count || 0,
          latest_service_visit:
            summary?.latestVisit || null,
          file_count:
            fileTotals.get(vehicle.registration) || 0,
        }
      }
    )

    setVehicles(enrichedVehicles)
    setSearching(false)
    setHasSearched(true)
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(`Unable to log out: ${error.message}`)
    }
  }

  function handleVehicleDeleted(deletedRegistration) {
    setVehicles((currentVehicles) =>
      currentVehicles.filter(
        (vehicle) =>
          vehicle.registration !== deletedRegistration
      )
    )

    setSelectedVehicle(null)
  }

  function handleVehicleUpdated(updatedVehicle) {
    setSelectedVehicle((currentVehicle) => ({
      ...currentVehicle,
      ...updatedVehicle,
    }))

    setVehicles((currentVehicles) =>
      currentVehicles.map((vehicle) =>
        vehicle.registration ===
        updatedVehicle.registration
          ? {
              ...vehicle,
              ...updatedVehicle,
            }
          : vehicle
      )
    )
  }

  function clearSearch() {
    setSearchText('')
    setVehicles([])
    setSelectedVehicle(null)
    setHasSearched(false)
    setSearchError('')
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return 'No service recorded'
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
    if (
      status === 'Ready for Collection' ||
      status === 'Ready'
    ) {
      return 'vehicle-search-status vehicle-search-status-ready'
    }

    if (status === 'Completed') {
      return 'vehicle-search-status vehicle-search-status-completed'
    }

    if (status === 'In Progress') {
      return 'vehicle-search-status vehicle-search-status-progress'
    }

    if (
      status === 'Waiting for Parts' ||
      status === 'Waiting for Inspection'
    ) {
      return 'vehicle-search-status vehicle-search-status-warning'
    }

    return 'vehicle-search-status'
  }

  const resultMessage = useMemo(() => {
    if (searching) {
      return 'Searching vehicle records...'
    }

    if (!hasSearched) {
      return 'Enter a registration, customer, phone number, make, model or VIN.'
    }

    if (vehicles.length === 0) {
      return 'No matching vehicle records were found.'
    }

    return `${vehicles.length} ${
      vehicles.length === 1 ? 'vehicle' : 'vehicles'
    } found`
  }, [hasSearched, searching, vehicles.length])

  return (
    <div className="app vehicle-search-page">
      <header className="app-header">
        <div className="app-header-inner">
          <button
            type="button"
            onClick={backToDashboard}
          >
            Back to Dashboard
          </button>

          <h1 className="app-header-title">
            Vehicle Service Archive
          </h1>

          <div className="app-header-actions">
            <button
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="vehicle-search-container">
        {selectedVehicle ? (
          <>
            <div className="vehicle-search-profile-toolbar">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setSelectedVehicle(null)
                }
              >
                Back to Search Results
              </button>

              <div>
                <span>Currently viewing</span>

                <strong>
                  {selectedVehicle.registration}
                </strong>
              </div>
            </div>

            <VehicleProfile
              vehicle={selectedVehicle}
              onVehicleDeleted={handleVehicleDeleted}
              onVehicleUpdated={handleVehicleUpdated}
            />
          </>
        ) : (
          <>
            <section className="vehicle-search-heading">
              <div>
                <span className="vehicle-search-eyebrow">
                  Vehicle Records
                </span>

                <h1>Find a Vehicle</h1>

                <p>
                  Search the complete workshop archive using
                  a registration, customer name, phone
                  number, make, model or VIN.
                </p>
              </div>
            </section>

            <section className="vehicle-search-panel">
              <div className="vehicle-search-field">
                <label htmlFor="vehicle-search">
                  Search vehicle records
                </label>

                <div className="vehicle-search-input-wrapper">
                  <span className="vehicle-search-input-icon">
                    ⌕
                  </span>

                  <input
                    id="vehicle-search"
                    type="search"
                    autoComplete="off"
                    placeholder="Example: 241-D-12345, customer name or Ford Transit"
                    value={searchText}
                    onChange={(event) =>
                      setSearchText(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        searchVehicles()
                      }
                    }}
                  />

                  {searchText && (
                    <button
                      type="button"
                      className="vehicle-search-inline-clear"
                      onClick={clearSearch}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <small>
                  Results update automatically as you type.
                </small>
              </div>

              <button
                type="button"
                className="vehicle-search-submit"
                onClick={() => searchVehicles()}
                disabled={
                  searching || !searchText.trim()
                }
              >
                {searching
                  ? 'Searching...'
                  : 'Search Vehicles'}
              </button>
            </section>

            <section className="vehicle-search-results">
              <div className="vehicle-search-results-heading">
                <div>
                  <span className="vehicle-search-eyebrow">
                    Workshop Archive
                  </span>

                  <h2>Search Results</h2>
                </div>

                <span className="vehicle-search-result-count">
                  {resultMessage}
                </span>
              </div>

              {searchError && (
                <div className="vehicle-search-error">
                  <strong>
                    Vehicle search could not be completed
                  </strong>

                  <p>{searchError}</p>
                </div>
              )}

              {searching && (
                <div className="vehicle-search-loading">
                  <span className="vehicle-search-spinner" />

                  <div>
                    <strong>
                      Searching vehicle records
                    </strong>

                    <p>
                      Checking customer and workshop data...
                    </p>
                  </div>
                </div>
              )}

              {!searching &&
                hasSearched &&
                !searchError &&
                vehicles.length === 0 && (
                  <div className="vehicle-search-empty">
                    <span>⌕</span>

                    <h3>No vehicles found</h3>

                    <p>
                      Try a different registration, customer
                      name, telephone number, make or model.
                    </p>
                  </div>
                )}

              {!searching &&
                !hasSearched &&
                !searchError && (
                  <div className="vehicle-search-empty">
                    <span>V</span>

                    <h3>Search the vehicle archive</h3>

                    <p>
                      Matching vehicle records will appear
                      here with their latest workshop
                      information.
                    </p>
                  </div>
                )}

              {!searching && vehicles.length > 0 && (
                <div className="vehicle-search-grid">
                  {vehicles.map((vehicle) => {
                    const latestVisit =
                      vehicle.latest_service_visit

                    const status =
                      latestVisit?.job_status ||
                      'No active status'

                    return (
                      <article
                        key={
                          vehicle.id ||
                          vehicle.registration
                        }
                        className="vehicle-search-result-card"
                      >
                        <div className="vehicle-search-card-top">
                          <div>
                            <span className="vehicle-search-card-label">
                              Registration
                            </span>

                            <h3>
                              {vehicle.registration}
                            </h3>
                          </div>

                          <span
                            className={getStatusClass(
                              status
                            )}
                          >
                            {status}
                          </span>
                        </div>

                        <div className="vehicle-search-vehicle-name">
                          <strong>
                            {vehicle.make ||
                              'Make not recorded'}{' '}
                            {vehicle.model || ''}
                          </strong>

                          <span>
                            {vehicle.year ||
                              'Year not recorded'}
                          </span>
                        </div>

                        <div className="vehicle-search-customer">
                          <span className="vehicle-search-avatar">
                            {vehicle.customer_name
                              ?.trim()
                              .charAt(0)
                              .toUpperCase() || 'C'}
                          </span>

                          <div>
                            <small>Customer</small>

                            <strong>
                              {vehicle.customer_name ||
                                'Not provided'}
                            </strong>

                            <span>
                              {vehicle.phone ||
                                'No phone number'}
                            </span>
                          </div>
                        </div>

                        <div className="vehicle-search-data-grid">
                          <div>
                            <small>Last service</small>

                            <strong>
                              {formatDate(
                                latestVisit?.service_date
                              )}
                            </strong>
                          </div>

                          <div>
                            <small>Latest mileage</small>

                            <strong>
                              {formatMileage(
                                latestVisit?.mileage,
                                latestVisit?.mileage_unit
                              )}
                            </strong>
                          </div>

                          <div>
                            <small>Service visits</small>

                            <strong>
                              {
                                vehicle.service_visit_count
                              }
                            </strong>
                          </div>

                          <div>
                            <small>Files</small>

                            <strong>
                              {vehicle.file_count}
                            </strong>
                          </div>
                        </div>

                        {vehicle.vin && (
                          <div className="vehicle-search-vin">
                            <small>VIN</small>

                            <span>{vehicle.vin}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          className="vehicle-search-open-button"
                          onClick={() =>
                            setSelectedVehicle(vehicle)
                          }
                        >
                          Open Vehicle Record
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}