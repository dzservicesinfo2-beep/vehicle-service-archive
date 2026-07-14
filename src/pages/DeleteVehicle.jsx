import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function DeleteVehicle({
  vehicle,
  onDeleted,
}) {
  const [deleting, setDeleting] = useState(false)

  async function deleteVehicle() {
    const confirmed = window.confirm(
      `Delete vehicle ${vehicle.registration}?\n\nThis will also delete its service visits and uploaded photos. This cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)

    const { data: photoFiles, error: photoListError } =
      await supabase.storage
        .from('vehicle-photos')
        .list('', {
          limit: 1000,
        })

    if (photoListError) {
      setDeleting(false)
      alert(photoListError.message)
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
        alert(photoDeleteError.message)
        return
      }
    }

    const { error: visitDeleteError } = await supabase
      .from('service_visits')
      .delete()
      .eq('registration', vehicle.registration)

    if (visitDeleteError) {
      setDeleting(false)
      alert(visitDeleteError.message)
      return
    }

    const { data: deletedVehicles, error: vehicleDeleteError } =
      await supabase
        .from('vehicles')
        .delete()
        .eq('registration', vehicle.registration)
        .select()

    setDeleting(false)

    if (vehicleDeleteError) {
      alert(vehicleDeleteError.message)
      return
    }

    if (!deletedVehicles || deletedVehicles.length === 0) {
      alert(
        'The vehicle was not deleted. Check the vehicle delete policy in Supabase.'
      )
      return
    }

    alert('Vehicle deleted successfully')

    if (onDeleted) {
      onDeleted(vehicle.registration)
    }
  }

  return (
    <div
      style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #ddd',
      }}
    >
      <h2>Delete Vehicle</h2>

      <p>
        Permanently delete this vehicle, its service
        history and its uploaded photos.
      </p>

      <button
        onClick={deleteVehicle}
        disabled={deleting}
        style={{
          backgroundColor: '#b42318',
          color: 'white',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '6px',
          cursor: deleting ? 'not-allowed' : 'pointer',
        }}
      >
        {deleting
          ? 'Deleting Vehicle...'
          : 'Delete Vehicle'}
      </button>
    </div>
  )
}