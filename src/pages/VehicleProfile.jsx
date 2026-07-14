import EditVehicle from './EditVehicle'
import PhotoGallery from './PhotoGallery'
import ServiceHistory from './ServiceHistory'
import NewServiceVisit from './NewServiceVisit'
import PhotoUpload from './PhotoUpload'
import PDFReport from './PDFReport'
import DeleteVehicle from './DeleteVehicle'

export default function VehicleProfile({
  vehicle,
  onVehicleDeleted,
  onVehicleUpdated,
}) {
  if (!vehicle) {
    return null
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>{vehicle.registration}</h1>

      <h2>Customer Details</h2>

      <p>
        <strong>Customer:</strong>{' '}
        {vehicle.customer_name || 'Not provided'}
      </p>

      <p>
        <strong>Phone:</strong>{' '}
        {vehicle.phone || 'Not provided'}
      </p>

      <p>
        <strong>Email:</strong>{' '}
        {vehicle.email || 'Not provided'}
      </p>

      <h2>Vehicle Details</h2>

      <p>
        <strong>Make:</strong>{' '}
        {vehicle.make || 'Not provided'}
      </p>

      <p>
        <strong>Model:</strong>{' '}
        {vehicle.model || 'Not provided'}
      </p>

      <p>
        <strong>Year:</strong>{' '}
        {vehicle.year || 'Not provided'}
      </p>

      <p>
        <strong>VIN:</strong>{' '}
        {vehicle.vin || 'Not provided'}
      </p>

      <h2>Notes</h2>

      <p>{vehicle.notes || 'No notes recorded.'}</p>

      <PDFReport vehicle={vehicle} />

      <EditVehicle
        vehicle={vehicle}
        onVehicleUpdated={onVehicleUpdated}
      />

      <PhotoUpload vehicle={vehicle} />

      <PhotoGallery vehicle={vehicle} />

      <hr />

      <NewServiceVisit vehicle={vehicle} />

      <ServiceHistory
        registration={vehicle.registration}
      />

      <DeleteVehicle
        vehicle={vehicle}
        onDeleted={onVehicleDeleted}
      />
    </div>
  )
}