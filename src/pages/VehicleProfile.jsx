import { useState } from 'react'
import EditVehicle from './EditVehicle'
import PhotoGallery from './PhotoGallery'
import ServiceHistory from './ServiceHistory'
import NewServiceVisit from './NewServiceVisit'
import PhotoUpload from './PhotoUpload'
import PDFReport from './PDFReport'
import DeleteVehicle from './DeleteVehicle'
import VehicleTimeline from './VehicleTimeline'

export default function VehicleProfile({
  vehicle,
  onVehicleDeleted,
  onVehicleUpdated,
}) {
  const [newVisit, setNewVisit] = useState(null)
  const [newPhoto, setNewPhoto] = useState(null)
  const [showEditVehicle, setShowEditVehicle] =
    useState(false)
  const [showNewServiceVisit, setShowNewServiceVisit] =
    useState(false)

  if (!vehicle) {
    return null
  }

  const vehicleDescription = [
    vehicle.year,
    vehicle.make,
    vehicle.model,
  ]
    .filter(Boolean)
    .join(' ')

  function handleVehicleUpdated(updatedVehicle) {
    if (onVehicleUpdated) {
      onVehicleUpdated(updatedVehicle)
    }

    setShowEditVehicle(false)
  }

  function handleVisitAdded(visit) {
    setNewVisit(visit)
    setShowNewServiceVisit(false)
  }

  return (
    <main className="vehicle-profile-page">
      <div className="vehicle-profile-container">
        <section className="vehicle-profile-hero">
          <div className="vehicle-profile-hero-content">
            <span className="vehicle-profile-label">
              Vehicle Record
            </span>

            <h1>{vehicle.registration}</h1>

            <p>
              {vehicleDescription ||
                'Vehicle details not provided'}
            </p>
          </div>

          <div className="vehicle-profile-hero-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setShowEditVehicle(
                  (currentValue) => !currentValue
                )
              }
            >
              {showEditVehicle
                ? 'Close Edit Form'
                : 'Edit Vehicle'}
            </button>

            <PDFReport vehicle={vehicle} />
          </div>
        </section>

        {showEditVehicle && (
          <section className="vehicle-profile-panel">
            <div className="vehicle-section-heading">
              <div>
                <span className="vehicle-section-eyebrow">
                  Vehicle Management
                </span>

                <h2>Edit Vehicle</h2>

                <p>
                  Update the customer and vehicle record.
                </p>
              </div>
            </div>

            <EditVehicle
              vehicle={vehicle}
              onVehicleUpdated={handleVehicleUpdated}
            />
          </section>
        )}

        <section className="vehicle-summary-grid">
          <article className="vehicle-summary-card">
            <div className="vehicle-card-heading">
              <div>
                <span className="vehicle-section-eyebrow">
                  Owner Information
                </span>

                <h2>Customer Details</h2>
              </div>
            </div>

            <dl className="vehicle-details-list">
              <div className="vehicle-details-row">
                <dt>Customer</dt>

                <dd>
                  {vehicle.customer_name ||
                    'Not provided'}
                </dd>
              </div>

              <div className="vehicle-details-row">
                <dt>Phone</dt>

                <dd>
                  {vehicle.phone || 'Not provided'}
                </dd>
              </div>

              <div className="vehicle-details-row">
                <dt>Email</dt>

                <dd>
                  {vehicle.email || 'Not provided'}
                </dd>
              </div>
            </dl>
          </article>

          <article className="vehicle-summary-card">
            <div className="vehicle-card-heading">
              <div>
                <span className="vehicle-section-eyebrow">
                  Vehicle Information
                </span>

                <h2>Vehicle Details</h2>
              </div>
            </div>

            <dl className="vehicle-details-list">
              <div className="vehicle-details-row">
                <dt>Registration</dt>

                <dd>{vehicle.registration}</dd>
              </div>

              <div className="vehicle-details-row">
                <dt>Make</dt>

                <dd>
                  {vehicle.make || 'Not provided'}
                </dd>
              </div>

              <div className="vehicle-details-row">
                <dt>Model</dt>

                <dd>
                  {vehicle.model || 'Not provided'}
                </dd>
              </div>

              <div className="vehicle-details-row">
                <dt>Year</dt>

                <dd>
                  {vehicle.year || 'Not provided'}
                </dd>
              </div>

              <div className="vehicle-details-row">
                <dt>VIN</dt>

                <dd>
                  {vehicle.vin || 'Not provided'}
                </dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="vehicle-profile-panel">
          <div className="vehicle-section-heading">
            <div>
              <span className="vehicle-section-eyebrow">
                Internal Information
              </span>

              <h2>Vehicle Notes</h2>
            </div>
          </div>

          <div className="vehicle-notes-content">
            <p>
              {vehicle.notes || 'No notes recorded.'}
            </p>
          </div>
        </section>

        <section className="vehicle-profile-panel">
          <div className="vehicle-section-heading vehicle-section-heading-actions">
            <div>
              <span className="vehicle-section-eyebrow">
                Workshop Records
              </span>

              <h2>Service Records</h2>

              <p>
                Add a new visit and review the complete
                service history.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowNewServiceVisit(
                  (currentValue) => !currentValue
                )
              }
            >
              {showNewServiceVisit
                ? 'Close Service Form'
                : 'Add Service Visit'}
            </button>
          </div>

          {showNewServiceVisit && (
            <div className="vehicle-profile-subsection">
              <NewServiceVisit
                vehicle={vehicle}
                onVisitAdded={handleVisitAdded}
              />
            </div>
          )}

          <div className="vehicle-profile-subsection">
            <ServiceHistory
              registration={vehicle.registration}
              newVisit={newVisit}
            />
          </div>
        </section>

        <section className="vehicle-profile-panel">
          <div className="vehicle-section-heading">
            <div>
              <span className="vehicle-section-eyebrow">
                Vehicle Files
              </span>

              <h2>Documents &amp; Photos</h2>

              <p>
                Upload and review documents, inspection
                images and workshop photos.
              </p>
            </div>
          </div>

          <div className="vehicle-files-layout">
            <div className="vehicle-upload-panel">
              <PhotoUpload
                vehicle={vehicle}
                onPhotoUploaded={setNewPhoto}
              />
            </div>

            <div className="vehicle-gallery-panel">
              <PhotoGallery
                vehicle={vehicle}
                newPhoto={newPhoto}
              />
            </div>
          </div>
        </section>

        <section className="vehicle-profile-panel">
          <div className="vehicle-section-heading">
            <div>
              <span className="vehicle-section-eyebrow">
                Activity History
              </span>

              <h2>Vehicle Timeline</h2>

              <p>
                Review service visits, uploaded files and
                recorded activity in date order.
              </p>
            </div>
          </div>

          <VehicleTimeline
            registration={vehicle.registration}
          />
        </section>

        <section className="vehicle-danger-panel">
          <div className="vehicle-section-heading">
            <div>
              <span className="vehicle-section-eyebrow">
                Permanent Action
              </span>

              <h2>Delete Vehicle</h2>

              <p>
                Permanently remove this vehicle and its
                associated records.
              </p>
            </div>
          </div>

          <DeleteVehicle
            vehicle={vehicle}
            onDeleted={onVehicleDeleted}
          />
        </section>
      </div>
    </main>
  )
}