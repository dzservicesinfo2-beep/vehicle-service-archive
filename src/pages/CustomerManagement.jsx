import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'

function normaliseEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function readFunctionError(error, fallback) {
  return error?.message || fallback
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

  const [editingCustomer, setEditingCustomer] =
    useState(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [savingCustomer, setSavingCustomer] =
    useState(false)

  const [changingStatusId, setChangingStatusId] =
    useState(null)

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
    const search = searchText
      .trim()
      .toLowerCase()

    if (!search) {
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

      return searchableText.includes(search)
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

  function clearMessages() {
    setErrorMessage('')
    setSuccessMessage('')
  }

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
    setEditingCustomer(null)
    clearMessages()
    setShowInviteForm(true)
  }

  function closeInviteForm() {
    if (inviting) return

    setInviteName('')
    setInviteEmail('')
    setShowInviteForm(false)
  }

  function openEditCustomer(customer) {
    setShowInviteForm(false)
    clearMessages()

    setEditingCustomer(customer)
    setEditName(customer.displayName || '')
    setEditEmail(customer.email || '')
    setEditPhone(customer.phone || '')
  }

  function closeEditCustomer() {
    if (savingCustomer) return

    setEditingCustomer(null)
    setEditName('')
    setEditEmail('')
    setEditPhone('')
  }

  async function inviteCustomer(event) {
    event.preventDefault()

    const fullName = inviteName.trim()
    const email = normaliseEmail(inviteEmail)

    clearMessages()

    if (!fullName) {
      setErrorMessage(
        'Customer or company name is required.'
      )
      return
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setErrorMessage(
        'Enter a valid customer email address.'
      )
      return
    }

    if (
      customers.some(
        (customer) =>
          normaliseEmail(customer.email) === email
      )
    ) {
      setErrorMessage(
        'A customer portal already exists for this email address.'
      )
      return
    }

    setInviting(true)

    const { data, error } =
      await supabase.functions.invoke('smooth-api', {
        body: {
          action: 'invite',
          fullName,
          email,
          redirectTo:
            `${window.location.origin}/reset-password`,
        },
      })

    setInviting(false)

    if (error) {
      setErrorMessage(
        `Customer invitation failed: ${readFunctionError(
          error,
          'Unable to contact the customer-management service.'
        )}`
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
      `Invitation sent to ${email}. The customer portal was created.`
    )

    await loadCustomers()
  }

  async function saveCustomer(event) {
    event.preventDefault()

    if (!editingCustomer) return

    const fullName = editName.trim()
    const email = normaliseEmail(editEmail)
    const phone = editPhone.trim()

    clearMessages()

    if (!fullName) {
      setErrorMessage(
        'Customer or company name is required.'
      )
      return
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setErrorMessage(
        'Enter a valid customer email address.'
      )
      return
    }

    setSavingCustomer(true)

    const { data, error } =
      await supabase.functions.invoke('smooth-api', {
        body: {
          action: 'update-customer',
          profileId: editingCustomer.id,
          authUserId:
            editingCustomer.auth_user_id,
          oldEmail: editingCustomer.email,
          fullName,
          email,
          phone,
        },
      })

    setSavingCustomer(false)

    if (error) {
      setErrorMessage(
        `Customer update failed: ${readFunctionError(
          error,
          'Unable to contact the customer-management service.'
        )}`
      )
      return
    }

    if (!data?.success) {
      setErrorMessage(
        data?.error ||
          'The customer could not be updated.'
      )
      return
    }

    setEditingCustomer(null)
    setSuccessMessage(
      `${fullName} was updated successfully.`
    )

    await loadCustomers()
  }

  async function changeCustomerStatus(customer) {
    const newActiveStatus = !customer.active

    const confirmationText = newActiveStatus
      ? `Activate portal access for ${customer.displayName}?`
      : `Deactivate portal access for ${customer.displayName}?`

    if (!window.confirm(confirmationText)) {
      return
    }

    clearMessages()
    setChangingStatusId(customer.id)

    const { data, error } =
      await supabase.functions.invoke('smooth-api', {
        body: {
          action: 'set-customer-active',
          profileId: customer.id,
          authUserId: customer.auth_user_id,
          active: newActiveStatus,
        },
      })

    setChangingStatusId(null)

    if (error) {
      setErrorMessage(
        `Portal status update failed: ${readFunctionError(
          error,
          'Unable to contact the customer-management service.'
        )}`
      )
      return
    }

    if (!data?.success) {
      setErrorMessage(
        data?.error ||
          'The portal status could not be changed.'
      )
      return
    }

    setSuccessMessage(
      newActiveStatus
        ? `${customer.displayName} can now access the customer portal.`
        : `${customer.displayName} can no longer access the customer portal.`
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
              Invite customers, edit their account details,
              control portal access and review linked
              vehicles.
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
            <strong>Action completed</strong>
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

        {editingCustomer && (
          <section className="customer-edit-panel">
            <div className="customer-invite-heading">
              <div>
                <span className="customer-management-eyebrow">
                  Customer Details
                </span>

                <h2>Edit Customer</h2>

                <p>
                  Changes to the email address will also
                  update the customer login and linked
                  vehicles.
                </p>
              </div>

              <button
                type="button"
                className="customer-invite-close"
                onClick={closeEditCustomer}
                disabled={savingCustomer}
              >
                Close
              </button>
            </div>

            <form
              className="customer-edit-form"
              onSubmit={saveCustomer}
            >
              <div className="customer-invite-field">
                <label htmlFor="edit-customer-name">
                  Customer or Company Name
                </label>

                <input
                  id="edit-customer-name"
                  type="text"
                  value={editName}
                  onChange={(event) =>
                    setEditName(event.target.value)
                  }
                  disabled={savingCustomer}
                  required
                />
              </div>

              <div className="customer-invite-field">
                <label htmlFor="edit-customer-email">
                  Login Email
                </label>

                <input
                  id="edit-customer-email"
                  type="email"
                  value={editEmail}
                  onChange={(event) =>
                    setEditEmail(event.target.value)
                  }
                  disabled={savingCustomer}
                  required
                />
              </div>

              <div className="customer-invite-field">
                <label htmlFor="edit-customer-phone">
                  Phone Number
                </label>

                <input
                  id="edit-customer-phone"
                  type="tel"
                  value={editPhone}
                  onChange={(event) =>
                    setEditPhone(event.target.value)
                  }
                  disabled={savingCustomer}
                />
              </div>

              <div className="customer-edit-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeEditCustomer}
                  disabled={savingCustomer}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="customer-invite-submit"
                  disabled={savingCustomer}
                >
                  {savingCustomer
                    ? 'Saving Customer...'
                    : 'Save Customer'}
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

                        <div className="customer-management-card-actions">
                          <button
                            type="button"
                            className="customer-management-view-button"
                            onClick={() =>
                              toggleCustomer(customer.id)
                            }
                          >
                            {expanded
                              ? 'Close'
                              : 'View'}
                          </button>

                          <button
                            type="button"
                            className="customer-management-edit-button"
                            onClick={() =>
                              openEditCustomer(customer)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={
                              customer.active
                                ? 'customer-management-status-button deactivate'
                                : 'customer-management-status-button activate'
                            }
                            onClick={() =>
                              changeCustomerStatus(customer)
                            }
                            disabled={
                              changingStatusId ===
                              customer.id
                            }
                          >
                            {changingStatusId === customer.id
                              ? 'Saving...'
                              : customer.active
                                ? 'Deactivate'
                                : 'Activate'}
                          </button>
                        </div>
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
                              <span>Account status</span>
                              <strong>
                                {customer.active
                                  ? 'Active'
                                  : 'Inactive'}
                              </strong>
                            </div>

                            <div>
                              <span>Created</span>
                              <strong>
                                {customer.created_at
                                  ? new Date(
                                      customer.created_at
                                    ).toLocaleDateString(
                                      'en-IE'
                                    )
                                  : 'Not recorded'}
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