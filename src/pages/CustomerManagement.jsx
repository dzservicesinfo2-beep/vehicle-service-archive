import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function normaliseEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export default function CustomerManagement({
  backToDashboard,
}) {
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [searchText, setSearchText] = useState('')
  const [expandedCustomerId, setExpandedCustomerId] =
    useState(null)

  const [showInviteForm, setShowInviteForm] =
    useState(false)

  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] =
    useState('')

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    const [profilesResult, vehiclesResult] =
      await Promise.all([
        supabase
          .from('profiles')
          .select(
            `
              id,
              auth_user_id,
              email,
              full_name,
              role,
              active,
              created_at
            `
          )
          .eq('role', 'customer')
          .order('created_at', {
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

    if (profilesResult.error) {
      setErrorMessage(
        `Unable to load customers: ${profilesResult.error.message}`
      )
      setLoading(false)
      return
    }

    if (vehiclesResult.error) {
      setErrorMessage(
        `Unable to load customer vehicles: ${vehiclesResult.error.message}`
      )
      setLoading(false)
      return
    }

    setCustomers(profilesResult.data || [])
    setVehicles(vehiclesResult.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const customerRecords = useMemo(() => {
    return customers.map((customer) => {
      const customerEmail = normaliseEmail(
        customer.email
      )

      const linkedVehicles = vehicles.filter(
        (vehicle) =>
          normaliseEmail(vehicle.email) ===
          customerEmail
      )

      const vehicleCustomerName =
        linkedVehicles.find((vehicle) =>
          vehicle.customer_name?.trim()
        )?.customer_name || ''

      const vehiclePhone =
        linkedVehicles.find((vehicle) =>
          vehicle.phone?.trim()
        )?.phone || ''

      return {
        ...customer,
        displayName:
          customer.full_name?.trim() ||
          vehicleCustomerName ||
          'Customer name not recorded',
        phone: vehiclePhone,
        linkedVehicles,
      }
    })
  }, [customers, vehicles])

  const filteredCustomers = useMemo(() => {
    const cleanSearch = searchText
      .trim()
      .toLowerCase()

    if (!cleanSearch) {
      return customerRecords
    }

    return customerRecords.filter((customer) => {
      const searchableText = [
        customer.displayName,
        customer.email,
        customer.phone,
        ...customer.linkedVehicles.map(
          (vehicle) => vehicle.registration
        ),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(cleanSearch)
    })
  }, [customerRecords, searchText])

  const activeCustomerCount = customerRecords.filter(
    (customer) => customer.active
  ).length

  const inactiveCustomerCount =
    customerRecords.length - activeCustomerCount

  const linkedVehicleCount = customerRecords.reduce(
    (total, customer) =>
      total + customer.linkedVehicles.length,
    0
  )

  function toggleCustomer(customerId) {
    setExpandedCustomerId((currentId) =>
      currentId === customerId
        ? null
        : customerId
    )
  }

  function openInviteForm() {
    setInviteName('')
    setInviteEmail('')
    setErrorMessage('')
    setSuccessMessage('')
    setShowInviteForm(true)
  }

  function closeInviteForm() {
    if (inviting) {
      return
    }

    setInviteName('')
    setInviteEmail('')
    setErrorMessage('')
    setShowInviteForm(false)
  }

  async function inviteCustomer(event) {
    event.preventDefault()

    const cleanName = inviteName.trim()
    const cleanEmail = normaliseEmail(inviteEmail)

    setErrorMessage('')
    setSuccessMessage('')

    if (!cleanName) {
      setErrorMessage(
        'Customer or company name is required.'
      )
      return
    }

    if (
      !cleanEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      setErrorMessage(
        'Enter a valid customer email address.'
      )
      return
    }

    const existingCustomer = customers.find(
      (customer) =>
        normaliseEmail(customer.email) === cleanEmail
    )

    if (existingCustomer) {
      setErrorMessage(
        'A customer portal already exists for this email address.'
      )
      return
    }

    setInviting(true)

   const { data, error } =
  await supabase.functions.invoke(
    'smooth-api',
    {
      body: {
        fullName: cleanName,
        email: cleanEmail,
        redirectTo:
          `${window.location.origin}/reset-password`,
      },
    }
  )

    setInviting(false)

    if (error) {
      let functionMessage = error.message

      try {
        const responseBody =
          await error.context?.json()

        if (responseBody?.error) {
          functionMessage = responseBody.error
        }
      } catch {
        // Keep the original Edge Function error.
      }

      setErrorMessage(
        `Customer invitation failed: ${functionMessage}`
      )
      return
    }

    if (!data?.success) {
      setErrorMessage(
        data?.error ||
          'The customer invitation could not be completed.'
      )
      return
    }

    setInviteName('')
    setInviteEmail('')
    setShowInviteForm(false)

    setSuccessMessage(
      `Invitation sent to ${cleanEmail}. The customer profile has been created.`
    )

    await loadCustomers()
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setErrorMessage(
        `Unable to log out: ${error.message}`
      )
    }
  }

  return (
    <div className="customer-management-page">
      <header className="customer-management-header">
        <div className="customer-management-header-inner">
          <button
            type="button"
            className="customer-management-back-button"
            onClick={backToDashboard}
          >
            Back to Dashboard
          </button>

          <div>
            <span>DZ Services Administration</span>

            <h1>Customer Management</h1>
          </div>

          <button
            type="button"
            className="customer-management-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="customer-management-container">
        <section className="customer-management-heading">
          <div>
            <span className="customer-management-eyebrow">
              Customer Accounts
            </span>

            <h2>Manage Customer Portal Access</h2>

            <p>
              Invite customers, view portal accounts and
              review vehicles linked to each customer.
            </p>
          </div>

          <button
            type="button"
            className="customer-management-create-button customer-management-create-button-active"
            onClick={openInviteForm}
          >
            Invite Customer
          </button>
        </section>

        {errorMessage && (
          <div
            className="customer-management-message customer-management-error"
            role="alert"
          >
            <strong>Action not completed</strong>

            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div
            className="customer-management-message customer-management-success"
            role="status"
          >
            <strong>Customer invited</strong>

            <p>{successMessage}</p>
          </div>
        )}

        {showInviteForm && (
          <section className="customer-invite-panel">
            <div className="customer-invite-heading">
              <div>
                <span className="customer-management-eyebrow">
                  New Portal Account
                </span>

                <h2>Invite Customer</h2>

                <p>
                  The customer will receive an email to
                  activate their account and create a
                  password.
                </p>
              </div>

              <button
                type="button"
                className="customer-invite-close"
                onClick={closeInviteForm}
                disabled={inviting}
              >
                Close
              </button>
            </div>

            <form
              className="customer-invite-form"
              onSubmit={inviteCustomer}
              noValidate
            >
              <div className="customer-invite-field">
                <label htmlFor="invite-customer-name">
                  Customer or Company Name
                </label>

                <input
                  id="invite-customer-name"
                  type="text"
                  placeholder="Customer or business name"
                  value={inviteName}
                  onChange={(event) =>
                    setInviteName(event.target.value)
                  }
                  disabled={inviting}
                />
              </div>

              <div className="customer-invite-field">
                <label htmlFor="invite-customer-email">
                  Email Address
                </label>

                <input
                  id="invite-customer-email"
                  type="email"
                  placeholder="customer@example.com"
                  value={inviteEmail}
                  onChange={(event) =>
                    setInviteEmail(event.target.value)
                  }
                  disabled={inviting}
                />
              </div>

              <div className="customer-invite-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeInviteForm}
                  disabled={inviting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="customer-invite-submit"
                  disabled={inviting}
                >
                  {inviting
                    ? 'Sending Invitation...'
                    : 'Create and Invite Customer'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="customer-management-stats">
          <article>
            <span>Total Customers</span>

            <strong>
              {loading ? '—' : customerRecords.length}
            </strong>

            <p>Registered customer portal accounts</p>
          </article>

          <article>
            <span>Active Accounts</span>

            <strong>
              {loading ? '—' : activeCustomerCount}
            </strong>

            <p>Customers permitted to log in</p>
          </article>

          <article>
            <span>Inactive Accounts</span>

            <strong>
              {loading ? '—' : inactiveCustomerCount}
            </strong>

            <p>Customer access currently disabled</p>
          </article>

          <article>
            <span>Linked Vehicles</span>

            <strong>
              {loading ? '—' : linkedVehicleCount}
            </strong>

            <p>Vehicles connected by customer email</p>
          </article>
        </section>

        <section className="customer-management-panel">
          <div className="customer-management-panel-heading">
            <div>
              <span className="customer-management-eyebrow">
                Customer Directory
              </span>

              <h2>Customers</h2>
            </div>

            <div className="customer-management-search">
              <label htmlFor="customer-search">
                Search customers
              </label>

              <input
                id="customer-search"
                type="text"
                placeholder="Name, email, phone or registration"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
              />
            </div>
          </div>

          {loading && (
            <div className="customer-management-empty">
              Loading customer accounts...
            </div>
          )}

          {!loading &&
            !errorMessage &&
            filteredCustomers.length === 0 && (
              <div className="customer-management-empty">
                <strong>No customers found</strong>

                <p>
                  No customer accounts match the current
                  search.
                </p>
              </div>
            )}

          {!loading &&
            filteredCustomers.length > 0 && (
              <div className="customer-management-list">
                {filteredCustomers.map((customer) => {
                  const expanded =
                    expandedCustomerId === customer.id

                  return (
                    <article
                      key={customer.id}
                      className={
                        expanded
                          ? 'customer-management-card customer-management-card-expanded'
                          : 'customer-management-card'
                      }
                    >
                      <div className="customer-management-card-main">
                        <div className="customer-management-customer">
                          <span>Customer</span>

                          <strong>
                            {customer.displayName}
                          </strong>

                          <small>
                            {customer.email ||
                              'Email not recorded'}
                          </small>
                        </div>

                        <div className="customer-management-contact">
                          <span>Phone</span>

                          <strong>
                            {customer.phone ||
                              'Not recorded'}
                          </strong>
                        </div>

                        <div className="customer-management-vehicle-count">
                          <span>Vehicles</span>

                          <strong>
                            {
                              customer.linkedVehicles
                                .length
                            }
                          </strong>
                        </div>

                        <div>
                          <span
                            className={
                              customer.active
                                ? 'customer-management-status active'
                                : 'customer-management-status inactive'
                            }
                          >
                            {customer.active
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="customer-management-view-button"
                          onClick={() =>
                            toggleCustomer(customer.id)
                          }
                        >
                          {expanded
                            ? 'Close'
                            : 'View Customer'}
                        </button>
                      </div>

                      {expanded && (
                        <div className="customer-management-expanded">
                          <div className="customer-management-account-details">
                            <div>
                              <span>Portal email</span>

                              <strong>
                                {customer.email ||
                                  'Not recorded'}
                              </strong>
                            </div>

                            <div>
                              <span>Account role</span>

                              <strong>
                                {customer.role}
                              </strong>
                            </div>

                            <div>
                              <span>Account status</span>

                              <strong>
                                {customer.active
                                  ? 'Active'
                                  : 'Inactive'}
                              </strong>
                            </div>
                          </div>

                          <section className="customer-management-vehicles">
                            <div className="customer-management-vehicles-heading">
                              <div>
                                <span>Customer fleet</span>

                                <h3>Linked Vehicles</h3>
                              </div>

                              <strong>
                                {
                                  customer.linkedVehicles
                                    .length
                                }
                              </strong>
                            </div>

                            {customer.linkedVehicles
                              .length === 0 && (
                              <div className="customer-management-no-vehicles">
                                No vehicles currently use
                                this customer’s portal email.
                              </div>
                            )}

                            {customer.linkedVehicles
                              .length > 0 && (
                              <div className="customer-management-vehicle-grid">
                                {customer.linkedVehicles.map(
                                  (vehicle) => (
                                    <article
                                      key={
                                        vehicle.registration
                                      }
                                    >
                                      <span>
                                        Registration
                                      </span>

                                      <strong>
                                        {
                                          vehicle.registration
                                        }
                                      </strong>

                                      <p>
                                        {[
                                          vehicle.year,
                                          vehicle.make,
                                          vehicle.model,
                                        ]
                                          .filter(Boolean)
                                          .join(' ') ||
                                          'Vehicle details not recorded'}
                                      </p>
                                    </article>
                                  )
                                )}
                              </div>
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
      </main>
    </div>
  )
}