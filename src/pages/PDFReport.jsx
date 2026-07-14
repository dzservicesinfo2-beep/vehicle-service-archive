import { jsPDF } from 'jspdf'
import { supabase } from '../lib/supabase'

export default function PDFReport({ vehicle }) {
async function generatePDF() {
const doc = new jsPDF()

const { data: visits } = await supabase
  .from('service_visits')
  .select('*')
  .eq('registration', vehicle.registration)
  .order('service_date', { ascending: false })

doc.setFontSize(18)
doc.text('Vehicle Service Report', 20, 20)

doc.setFontSize(12)

let y = 40

doc.text(`Registration: ${vehicle.registration}`, 20, y)
y += 10

doc.text(`Customer: ${vehicle.customer_name || ''}`, 20, y)
y += 10

doc.text(`Phone: ${vehicle.phone || ''}`, 20, y)
y += 10

doc.text(
  `Vehicle: ${vehicle.make || ''} ${vehicle.model || ''}`,
  20,
  y
)
y += 10

doc.text(`Year: ${vehicle.year || ''}`, 20, y)
y += 10

doc.text(`VIN: ${vehicle.vin || ''}`, 20, y)
y += 20

doc.text('Notes:', 20, y)
y += 10

doc.text(vehicle.notes || '', 20, y)
y += 20

doc.setFontSize(16)
doc.text('Service History', 20, y)
y += 15

doc.setFontSize(12)

visits?.forEach((visit, index) => {
  if (y > 250) {
    doc.addPage()
    y = 20
  }

  doc.text(
    `Service Visit ${index + 1}`,
    20,
    y
  )
  y += 10

  doc.text(
    `Date: ${visit.service_date || ''}`,
    20,
    y
  )
  y += 10

  doc.text(
    `Entry: ${visit.entry_report || ''}`,
    20,
    y
  )
  y += 10

  doc.text(
    `Repairs: ${visit.repairs_report || ''}`,
    20,
    y
  )
  y += 10

  doc.text(
    `Parts: ${visit.repair_parts || ''}`,
    20,
    y
  )
  y += 10

  doc.text(
    `Summary: ${visit.completion_summary || ''}`,
    20,
    y
  )
  y += 20
})

doc.save(`${vehicle.registration}-report.pdf`)


}

return ( <button onClick={generatePDF}>
Generate PDF Report </button>
)
}