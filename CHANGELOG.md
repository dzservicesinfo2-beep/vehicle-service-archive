# Vehicle Service Archive — Changelog

## Version 0.4 — July 2026

### Added

* Employee dashboard with vehicle, customer, and service visit statistics.
* Vehicle search by registration, customer name, phone, make, and model.
* Add New Vehicle workflow.
* Vehicle profile pages.
* Edit Vehicle workflow.
* Photo upload and photo gallery.
* New Service Visit workflow.
* Service visit editing.
* Vehicle PDF reports.
* Individual service visit PDF reports.
* Customer portal.
* Employee navigation between dashboard, search, vehicle profiles, and new vehicle pages.
* Delete Vehicle workflow with related service visit and photo removal.

### Improved

* Repaired broken JSX in `VehicleSearch.jsx`.
* Added loading and empty-result states to Vehicle Search.
* Added duplicate-submission protection when editing vehicles.
* Added immediate profile refresh after editing vehicle details.
* Added immediate search-card refresh after editing a vehicle.
* Added clearer employee navigation.
* Added Git version-control checkpoints.

### Current Development Focus

* Immediate refresh after adding or editing service visits.
* Immediate photo-gallery refresh after uploading photos.
* Consistent loading and error states.
* Production security review.
* GitHub and Vercel deployment.