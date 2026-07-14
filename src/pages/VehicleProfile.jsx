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
}) {
  if (!vehicle) return null

  return (
    <div style={{ padding: '20px' }}>
      <h1>{vehicle.registration}</h1>

      <h2>Customer Details</h2>

      <p>
        <strong>Customer:</strong>{' '}
        {vehicle.customer_name}
      </p>

      <p>
        <strong>Phone:</strong> {vehicle.phone}
      </p>

      <p>
        <strong>Email:</strong> {vehicle.email}
      </p>

      <h2>Vehicle Details</h2>

      <p>
        <strong>Make:</strong> {vehicle.make}
      </p>

      <p>
        <strong>Model:</strong> {vehicle.model}
      </p>

      <p>
        <strong>Year:</strong> {vehicle.year}
      </p>

      <p>
        <strong>VIN:</strong> {vehicle.vin}
      </p>

      <h2>Notes</h2>

      <p>{vehicle.notes}</p>

      <PDFReport vehicle={vehicle} />

      <EditVehicle vehicle={vehicle} />

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