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
      alert(error.message)
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

  return (
    <div style={{ padding: '30px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1>Vehicle Service Archive</h1>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          margin: '30px 0',
        }}
      >
        <div>
          <h2>Total Vehicles</h2>
          <h1>{loading ? '...' : vehicleCount}</h1>
        </div>

        <div>
          <h2>Total Customers</h2>
          <h1>{loading ? '...' : customerCount}</h1>
        </div>

        <div>
          <h2>Total Service Visits</h2>
          <h1>{loading ? '...' : serviceCount}</h1>
        </div>
      </div>

      <button onClick={openVehicleSearch}>
        Open Vehicle Search
      </button>

      <button
        onClick={openNewVehicle}
        style={{ marginLeft: '10px' }}
      >
        Add New Vehicle
      </button>

      <hr />

      <h2>Internal Service Reminders</h2>

      {reminders.length === 0 ? (
        <p>No open service reminders.</p>
      ) : (
        reminders.map((reminder) => {
          const overdue =
            reminder.due_date &&
            new Date(reminder.due_date) <
              new Date(
                new Date().toISOString().split('T')[0]
              )

          return (
            <div
              key={reminder.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '12px',
              }}
            >
              <h3>{reminder.registration}</h3>

              <p>
                Due date:{' '}
                {reminder.due_date || 'Not set'}
              </p>

              <p>
                Due mileage:{' '}
                {reminder.due_mileage || 'Not set'}
              </p>

              {overdue && (
                <p>
                  <strong>OVERDUE</strong>
                </p>
              )}

              <button
                onClick={() =>
                  completeReminder(reminder.id)
                }
              >
                Mark Complete
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}