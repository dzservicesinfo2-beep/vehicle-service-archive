import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({
  openVehicleSearch,
  openNewVehicle,
}) {
  const [vehicleCount, setVehicleCount] = useState(0)
  const [customerCount, setCustomerCount] = useState(0)
  const [serviceCount, setServiceCount] = useState(0)
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const [
        vehiclesResult,
        customersResult,
        servicesResult,
        remindersResult,
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
      ])

      const uniqueCustomers = new Set(
        (customersResult.data || [])
          .map((vehicle) =>
            vehicle.customer_name
              ?.trim()
              .toLowerCase()
          )
          .filter(Boolean)
      )

      setVehicleCount(vehiclesResult.count || 0)
      setCustomerCount(uniqueCustomers.size)
      setServiceCount(servicesResult.count || 0)
      setReminders(remindersResult.data || [])
      setLoading(false)
    }

    loadDashboard()
  }, [])

  async function completeReminder(reminderId) {
    const { error } = await supabase
      .from('service_reminders')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', reminderId)

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
    await supabase.auth.signOut()
  }

  function isReminderOverdue(dueDate) {
    if (!dueDate) {
      return false
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const reminderDate = new Date(`${dueDate}T00:00:00`)

    return reminderDate < today
  }

  const cardStyle = {
    width: '220px',
    minHeight: '130px',
    padding: '22px',
    border: '1px solid #dedede',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    textAlign: 'center',
  }

  const actionButtonStyle = {
    padding: '11px 18px',
    fontSize: '15px',
    cursor: 'pointer',
  }

  return (
    <main
      style={{
        width: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box',
        padding: '35px 20px 60px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '48px',
              lineHeight: 1.2,
            }}
          >
            Vehicle Service Archive
          </h1>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              position: 'absolute',
              top: '8px',
              right: 0,
              padding: '7px 12px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>

        <section
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '35px',
          }}
        >
          <div style={cardStyle}>
            <h2
              style={{
                marginTop: 0,
                fontSize: '20px',
              }}
            >
              Total Vehicles
            </h2>

            <div
              style={{
                fontSize: '44px',
                fontWeight: 'bold',
              }}
            >
              {loading ? '...' : vehicleCount}
            </div>
          </div>

          <div style={cardStyle}>
            <h2
              style={{
                marginTop: 0,
                fontSize: '20px',
              }}
            >
              Total Customers
            </h2>

            <div
              style={{
                fontSize: '44px',
                fontWeight: 'bold',
              }}
            >
              {loading ? '...' : customerCount}
            </div>
          </div>

          <div style={cardStyle}>
            <h2
              style={{
                marginTop: 0,
                fontSize: '20px',
              }}
            >
              Total Service Visits
            </h2>

            <div
              style={{
                fontSize: '44px',
                fontWeight: 'bold',
              }}
            >
              {loading ? '...' : serviceCount}
            </div>
          </div>
        </section>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '35px',
          }}
        >
          <button
            type="button"
            onClick={openVehicleSearch}
            style={actionButtonStyle}
          >
            Open Vehicle Search
          </button>

          <button
            type="button"
            onClick={openNewVehicle}
            style={actionButtonStyle}
          >
            Add New Vehicle
          </button>
        </div>

        <hr
          style={{
            border: 0,
            borderTop: '1px solid #cccccc',
            marginBottom: '28px',
          }}
        />

        <section
          style={{
            width: '100%',
            maxWidth: '850px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              marginBottom: '18px',
            }}
          >
            Internal Service Reminders
          </h2>

          {loading && <p>Loading reminders...</p>}

          {!loading && reminders.length === 0 && (
            <p
              style={{
                color: '#666666',
                fontSize: '17px',
              }}
            >
              No open service reminders.
            </p>
          )}

          {!loading &&
            reminders.map((reminder) => {
              const overdue = isReminderOverdue(
                reminder.due_date
              )

              return (
                <article
                  key={reminder.id}
                  style={{
                    border: overdue
                      ? '2px solid #b42318'
                      : '1px solid #dddddd',
                    borderRadius: '10px',
                    padding: '18px',
                    marginBottom: '14px',
                    textAlign: 'left',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          marginTop: 0,
                          marginBottom: '10px',
                        }}
                      >
                        {reminder.registration}
                      </h3>

                      <p>
                        <strong>Due date:</strong>{' '}
                        {reminder.due_date || 'Not set'}
                      </p>

                      <p>
                        <strong>Due mileage:</strong>{' '}
                        {reminder.due_mileage ??
                          'Not set'}
                      </p>

                      {reminder.notes && (
                        <p>
                          <strong>Notes:</strong>{' '}
                          {reminder.notes}
                        </p>
                      )}

                      {overdue && (
                        <p
                          style={{
                            fontWeight: 'bold',
                            color: '#b42318',
                          }}
                        >
                          OVERDUE
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        completeReminder(reminder.id)
                      }
                      style={{
                        padding: '9px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      Mark Complete
                    </button>
                  </div>
                </article>
              )
            })}
        </section>
      </div>
    </main>
  )
}