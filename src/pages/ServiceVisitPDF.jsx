import { jsPDF } from 'jspdf'

export default function ServiceVisitPDF({
vehicle,
visit,
}) {
function generatePDF() {
const doc = new jsPDF()

doc.setFontSize(18)
doc.text('Service Visit Report', 20, 20)

doc.setFontSize(12)

let y = 40

doc.text(
  `Registration: ${vehicle.registration}`,
  20,
  y
)
y += 10

doc.text(
  `Vehicle: ${vehicle.make} ${vehicle.model}`,
  20,
  y
)
y += 10

doc.text(
  `Date: ${visit.service_date}`,
  20,
  y
)
y += 20

doc.text('Entry Report:', 20, y)
y += 10

doc.text(
  visit.entry_report || '',
  20,
  y
)
y += 20

doc.text('Repairs:', 20, y)
y += 10

doc.text(
  visit.repairs_report || '',
  20,
  y
)
y += 20

doc.text('Parts Used:', 20, y)
y += 10

doc.text(
  visit.repair_parts || '',
  20,
  y
)
y += 20

doc.text('Completion Summary:', 20, y)
y += 10

doc.text(
  visit.completion_summary || '',
  20,
  y
)

doc.save(
  `${vehicle.registration}-${visit.service_date}.pdf`
)

}

return ( <button onClick={generatePDF}>
Download PDF </button>
)
}