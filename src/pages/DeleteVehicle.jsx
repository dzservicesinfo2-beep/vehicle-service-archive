import { useState } from 'react'
import { supabase } from '../lib/supabase'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusMessage from '../components/StatusMessage'

export default function DeleteVehicle({
  vehicle,
  onDeleted,
}) {
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] =
    useState('')

  function requestDeleteVehicle() {
    setErrorMessage('')
    setSuccessMessage('')
    setConfirmOpen(true)
  }

  async function deleteVehicle() {
    if (deleting) {
      return
    }

    setDeleting(true)
    setErrorMessage('')
    setSuccessMessage('')

    const { data: photoFiles, error: photoListError } =
      await supabase.storage
        .from('vehicle-photos')
        .list('', {
          limit: 1000,
        })

    if (photoListError) {
      setDeleting(false)
      setErrorMessage(photoListError.message)
      return
    }

    const matchingPhotoNames = (photoFiles || [])
      .filter((photo) =>
        photo.name.startsWith(
          `${vehicle.registration}-`
        )
      )
      .map((photo) => photo.name)

    if (matchingPhotoNames.length > 0) {
      const { error: photoDeleteError } =
        await supabase.storage
          .from('vehicle-photos')
          .remove(matchingPhotoNames)

      if (photoDeleteError) {
        setDeleting(false)
        setErrorMessage(photoDeleteError.message)
        return
      }
    }

    const { error: visitDeleteError } = await supabase
      .from('service_visits')
      .delete()
      .eq('registration', vehicle.registration)

    if (visitDeleteError) {
      setDeleting(false)
      setErrorMessage(visitDeleteError.message)
      return
    }

    const { error: reminderDeleteError } = await supabase
      .from('service_reminders')
      .delete()
      .eq('registration', vehicle.registration)

    if (reminderDeleteError) {
      setDeleting(false)
      setErrorMessage(reminderDeleteError.message)
      return
    }

    const {
      data: deletedVehicles,
      error: vehicleDeleteError,
    } = await supabase
      .from('vehicles')
      .delete()
      .eq('registration', vehicle.registration)
      .select()

    setDeleting(false)

    if (vehicleDeleteError) {
      setErrorMessage(vehicleDeleteError.message)
      return
    }

    if (!deletedVehicles || deletedVehicles.length === 0) {
      setErrorMessage(
        'The vehicle was not deleted. Check the vehicle delete policy in Supabase.'
      )
      return
    }

    setConfirmOpen(false)
    setSuccessMessage('Vehicle deleted successfully.')

    if (onDeleted) {
      onDeleted(vehicle.registration)
    }
  }

  return (
    <div className="delete-vehicle-panel">
      <StatusMessage
        type="error"
        title="Action not completed"
        message={errorMessage}
        onClose={() => setErrorMessage('')}
      />

      <StatusMessage
        type="success"
        title="Action completed"
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />

      <h2>Delete Vehicle</h2>

      <p>
        Permanently delete this vehicle, its service
        history, service reminders and uploaded photos.
      </p>

      <button
        type="button"
        className="danger-button"
        onClick={requestDeleteVehicle}
        disabled={deleting}
      >
        {deleting
          ? 'Deleting Vehicle...'
          : 'Delete Vehicle'}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${vehicle.registration}?`}
        message="This will permanently delete the vehicle, its service visits, service reminders and uploaded photos. This action cannot be undone."
        confirmLabel="Delete Vehicle"
        danger
        busy={deleting}
        onCancel={() => {
          if (!deleting) {
            setConfirmOpen(false)
          }
        }}
        onConfirm={deleteVehicle}
      />
    </div>
  )
}
