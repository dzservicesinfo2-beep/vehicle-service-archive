import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { supabase } from '../lib/supabase'

const PDF_COLOURS = {
  navy: [15, 23, 42],
  blue: [37, 99, 235],
  lightBlue: [239, 246, 255],
  slate: [71, 85, 105],
  lightSlate: [241, 245, 249],
  border: [203, 213, 225],
  white: [255, 255, 255],
  green: [22, 101, 52],
  lightGreen: [240, 253, 244],
}

const PAGE = {
  width: 210,
  height: 297,
  marginLeft: 18,
  marginRight: 18,
  top: 18,
  bottom: 22,
}

function cleanText(value, fallback = 'Not recorded') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function formatDate(value) {
  if (!value) {
    return 'Not recorded'
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatGeneratedDate(date) {
  return new Intl.DateTimeFormat('en-IE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function createReportNumber(registration, generatedAt) {
  const year = generatedAt.getFullYear()
  const month = String(
    generatedAt.getMonth() + 1
  ).padStart(2, '0')
  const day = String(generatedAt.getDate()).padStart(
    2,
    '0'
  )

  const cleanRegistration = String(registration || 'VEHICLE')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

  return `SR-${year}${month}${day}-${cleanRegistration}`
}

function setTextColour(doc, colour) {
  doc.setTextColor(...colour)
}

function setFillColour(doc, colour) {
  doc.setFillColor(...colour)
}

function setDrawColour(doc, colour) {
  doc.setDrawColor(...colour)
}

function drawRoundedPanel(
  doc,
  x,
  y,
  width,
  height,
  fillColour = PDF_COLOURS.white,
  borderColour = PDF_COLOURS.border
) {
  setFillColour(doc, fillColour)
  setDrawColour(doc, borderColour)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, width, height, 2.5, 2.5, 'FD')
}

function drawSectionTitle(doc, title, y) {
  setFillColour(doc, PDF_COLOURS.navy)
  doc.roundedRect(
    PAGE.marginLeft,
    y,
    PAGE.width - PAGE.marginLeft - PAGE.marginRight,
    11,
    2,
    2,
    'F'
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColour(doc, PDF_COLOURS.white)
  doc.text(title.toUpperCase(), PAGE.marginLeft + 5, y + 7)

  return y + 16
}

function drawInformationField(
  doc,
  label,
  value,
  x,
  y,
  width,
  options = {}
) {
  const {
    height = 18,
    valueFontSize = 10,
    highlight = false,
  } = options

  drawRoundedPanel(
    doc,
    x,
    y,
    width,
    height,
    highlight
      ? PDF_COLOURS.lightBlue
      : PDF_COLOURS.lightSlate,
    highlight ? PDF_COLOURS.blue : PDF_COLOURS.border
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setTextColour(doc, PDF_COLOURS.slate)
  doc.text(label.toUpperCase(), x + 4, y + 5.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(valueFontSize)
  setTextColour(
    doc,
    highlight ? PDF_COLOURS.blue : PDF_COLOURS.navy
  )

  const lines = doc.splitTextToSize(
    cleanText(value),
    width - 8
  )

  doc.text(lines.slice(0, 2), x + 4, y + 12)

  return y + height
}

function getWrappedTextHeight(
  doc,
  text,
  width,
  fontSize = 9,
  lineHeight = 4.5
) {
  doc.setFontSize(fontSize)

  const lines = doc.splitTextToSize(
    cleanText(text),
    width
  )

  return {
    lines,
    height: Math.max(lines.length * lineHeight, lineHeight),
  }
}

function drawTextBlock(
  doc,
  label,
  value,
  x,
  y,
  width,
  options = {}
) {
  const {
    minimumHeight = 27,
    fillColour = PDF_COLOURS.white,
    borderColour = PDF_COLOURS.border,
  } = options

  doc.setFont('helvetica', 'normal')

  const wrapped = getWrappedTextHeight(
    doc,
    value,
    width - 8,
    9,
    4.5
  )

  const panelHeight = Math.max(
    minimumHeight,
    wrapped.height + 15
  )

  drawRoundedPanel(
    doc,
    x,
    y,
    width,
    panelHeight,
    fillColour,
    borderColour
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setTextColour(doc, PDF_COLOURS.slate)
  doc.text(label.toUpperCase(), x + 4, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setTextColour(doc, PDF_COLOURS.navy)
  doc.text(wrapped.lines, x + 4, y + 13)

  return panelHeight
}

function drawDocumentHeader(
  doc,
  vehicle,
  reportNumber,
  generatedAt
) {
  setFillColour(doc, PDF_COLOURS.navy)
  doc.rect(0, 0, PAGE.width, 52, 'F')

  setFillColour(doc, PDF_COLOURS.blue)
  doc.rect(0, 52, PAGE.width, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  setTextColour(doc, PDF_COLOURS.white)
  doc.text('DZ SERVICES', PAGE.marginLeft, 18)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'VAN & LIGHT COMMERCIAL REPAIRS',
    PAGE.marginLeft,
    25
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(
    'VEHICLE SERVICE REPORT',
    PAGE.marginLeft,
    39
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(
    `Report: ${reportNumber}`,
    PAGE.width - PAGE.marginRight,
    17,
    { align: 'right' }
  )

  doc.text(
    `Generated: ${formatGeneratedDate(generatedAt)}`,
    PAGE.width - PAGE.marginRight,
    24,
    { align: 'right' }
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(
    cleanText(vehicle.registration, 'NO REGISTRATION'),
    PAGE.width - PAGE.marginRight,
    40,
    { align: 'right' }
  )

  return 65
}

function addContentPage(doc, title) {
  doc.addPage()

  setFillColour(doc, PDF_COLOURS.navy)
  doc.rect(0, 0, PAGE.width, 24, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  setTextColour(doc, PDF_COLOURS.white)
  doc.text('DZ SERVICES', PAGE.marginLeft, 15)

  doc.setFontSize(9)
  doc.text(
    title.toUpperCase(),
    PAGE.width - PAGE.marginRight,
    15,
    { align: 'right' }
  )

  setFillColour(doc, PDF_COLOURS.blue)
  doc.rect(0, 24, PAGE.width, 2, 'F')

  return 35
}

function ensureSpace(doc, y, requiredHeight, pageTitle) {
  const availableBottom = PAGE.height - PAGE.bottom

  if (y + requiredHeight <= availableBottom) {
    return y
  }

  return addContentPage(doc, pageTitle)
}

function calculateVisitHeight(doc, visit, contentWidth) {
  const blockWidth = contentWidth

  const entry = getWrappedTextHeight(
    doc,
    visit.entry_report,
    blockWidth - 8
  )

  const repairs = getWrappedTextHeight(
    doc,
    visit.repairs_report,
    blockWidth - 8
  )

  const parts = getWrappedTextHeight(
    doc,
    visit.repair_parts,
    blockWidth - 8
  )

  const summary = getWrappedTextHeight(
    doc,
    visit.completion_summary,
    blockWidth - 8
  )

  const blockHeights = [
    Math.max(27, entry.height + 15),
    Math.max(27, repairs.height + 15),
    Math.max(27, parts.height + 15),
    Math.max(27, summary.height + 15),
  ]

  return 25 + blockHeights.reduce(
    (total, height) => total + height + 5,
    0
  )
}

function drawServiceVisit(
  doc,
  visit,
  visitNumber,
  totalVisits,
  y
) {
  const contentWidth =
    PAGE.width - PAGE.marginLeft - PAGE.marginRight

  const estimatedHeight = calculateVisitHeight(
    doc,
    visit,
    contentWidth
  )

  y = ensureSpace(
    doc,
    y,
    Math.min(estimatedHeight, 230),
    'Service History'
  )

  setFillColour(doc, PDF_COLOURS.lightBlue)
  setDrawColour(doc, PDF_COLOURS.blue)
  doc.setLineWidth(0.4)
  doc.roundedRect(
    PAGE.marginLeft,
    y,
    contentWidth,
    17,
    2.5,
    2.5,
    'FD'
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColour(doc, PDF_COLOURS.blue)
  doc.text(
    `SERVICE VISIT ${visitNumber} OF ${totalVisits}`,
    PAGE.marginLeft + 5,
    y + 7
  )

  doc.setFontSize(9)
  setTextColour(doc, PDF_COLOURS.navy)
  doc.text(
    formatDate(visit.service_date),
    PAGE.width - PAGE.marginRight - 5,
    y + 7,
    { align: 'right' }
  )

  y += 22

  const blocks = [
    {
      label: 'Vehicle Entry Report',
      value: visit.entry_report,
    },
    {
      label: 'Repairs and Work Carried Out',
      value: visit.repairs_report,
    },
    {
      label: 'Parts Used',
      value: visit.repair_parts,
    },
    {
      label: 'Completion Summary',
      value: visit.completion_summary,
    },
  ]

  blocks.forEach((block) => {
    doc.setFont('helvetica', 'normal')

    const wrapped = getWrappedTextHeight(
      doc,
      block.value,
      contentWidth - 8
    )

    const blockHeight = Math.max(
      27,
      wrapped.height + 15
    )

    y = ensureSpace(
      doc,
      y,
      blockHeight + 5,
      'Service History'
    )

    const drawnHeight = drawTextBlock(
      doc,
      block.label,
      block.value,
      PAGE.marginLeft,
      y,
      contentWidth,
      {
        minimumHeight: 27,
      }
    )

    y += drawnHeight + 5
  })

  return y + 4
}

function addPageFooters(
  doc,
  reportNumber,
  generatedAt
) {
  const totalPages = doc.getNumberOfPages()

  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber += 1
  ) {
    doc.setPage(pageNumber)

    setDrawColour(doc, PDF_COLOURS.border)
    doc.setLineWidth(0.25)
    doc.line(
      PAGE.marginLeft,
      PAGE.height - 16,
      PAGE.width - PAGE.marginRight,
      PAGE.height - 16
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColour(doc, PDF_COLOURS.slate)

    doc.text(
      'DZ Services | Greenogue Business Park, Dublin',
      PAGE.marginLeft,
      PAGE.height - 10
    )

    doc.text(
      reportNumber,
      PAGE.width / 2,
      PAGE.height - 10,
      { align: 'center' }
    )

    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      PAGE.width - PAGE.marginRight,
      PAGE.height - 10,
      { align: 'right' }
    )

    doc.setFontSize(6.5)
    doc.text(
      `Generated ${formatGeneratedDate(generatedAt)}`,
      PAGE.width - PAGE.marginRight,
      PAGE.height - 6,
      { align: 'right' }
    )
  }
}

export default function PDFReport({ vehicle }) {
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  async function generatePDF() {
    if (!vehicle?.registration) {
      setMessageType('error')
      setMessage(
        'The PDF cannot be generated because the vehicle registration is missing.'
      )
      return
    }

    setGenerating(true)
    setMessage('')
    setMessageType('')

    const { data: visits, error } = await supabase
      .from('service_visits')
      .select('*')
      .eq('registration', vehicle.registration)
      .order('service_date', { ascending: false })

    if (error) {
      setGenerating(false)
      setMessageType('error')
      setMessage(
        `The service history could not be loaded: ${error.message}`
      )
      return
    }

    try {
      const generatedAt = new Date()

      const reportNumber = createReportNumber(
        vehicle.registration,
        generatedAt
      )

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      })

      doc.setProperties({
        title: `Vehicle Service Report - ${vehicle.registration}`,
        subject: 'DZ Services Vehicle Service Report',
        author: 'DZ Services',
        creator: 'Vehicle Service Archive',
        keywords:
          'vehicle, service, repair, maintenance, DZ Services',
      })

      let y = drawDocumentHeader(
        doc,
        vehicle,
        reportNumber,
        generatedAt
      )

      y = drawSectionTitle(doc, 'Customer Details', y)

      const informationGap = 5
      const informationWidth =
        (PAGE.width -
          PAGE.marginLeft -
          PAGE.marginRight -
          informationGap) /
        2

      drawInformationField(
        doc,
        'Customer or Company',
        vehicle.customer_name,
        PAGE.marginLeft,
        y,
        informationWidth,
        {
          highlight: true,
        }
      )

      drawInformationField(
        doc,
        'Phone Number',
        vehicle.phone,
        PAGE.marginLeft +
          informationWidth +
          informationGap,
        y,
        informationWidth
      )

      y += 23

      drawInformationField(
        doc,
        'Email Address',
        vehicle.email,
        PAGE.marginLeft,
        y,
        PAGE.width -
          PAGE.marginLeft -
          PAGE.marginRight
      )

      y += 25
      y = drawSectionTitle(doc, 'Vehicle Details', y)

      drawInformationField(
        doc,
        'Registration',
        vehicle.registration,
        PAGE.marginLeft,
        y,
        informationWidth,
        {
          highlight: true,
          valueFontSize: 12,
        }
      )

      drawInformationField(
        doc,
        'Vehicle Year',
        vehicle.year,
        PAGE.marginLeft +
          informationWidth +
          informationGap,
        y,
        informationWidth
      )

      y += 23

      drawInformationField(
        doc,
        'Make',
        vehicle.make,
        PAGE.marginLeft,
        y,
        informationWidth
      )

      drawInformationField(
        doc,
        'Model',
        vehicle.model,
        PAGE.marginLeft +
          informationWidth +
          informationGap,
        y,
        informationWidth
      )

      y += 23

      drawInformationField(
        doc,
        'Vehicle Identification Number',
        vehicle.vin,
        PAGE.marginLeft,
        y,
        PAGE.width -
          PAGE.marginLeft -
          PAGE.marginRight
      )

      y += 25
      y = drawSectionTitle(doc, 'Workshop Notes', y)

      const notesHeight = drawTextBlock(
        doc,
        'Vehicle or Customer Notes',
        vehicle.notes,
        PAGE.marginLeft,
        y,
        PAGE.width -
          PAGE.marginLeft -
          PAGE.marginRight,
        {
          minimumHeight: 36,
        }
      )

      y += notesHeight + 10
      y = ensureSpace(
        doc,
        y,
        32,
        'Service History'
      )

      y = drawSectionTitle(doc, 'Report Summary', y)

      drawInformationField(
        doc,
        'Recorded Service Visits',
        String(visits?.length || 0),
        PAGE.marginLeft,
        y,
        informationWidth,
        {
          highlight: true,
          valueFontSize: 12,
        }
      )

      drawInformationField(
        doc,
        'Most Recent Service',
        visits?.[0]?.service_date
          ? formatDate(visits[0].service_date)
          : 'No service visits recorded',
        PAGE.marginLeft +
          informationWidth +
          informationGap,
        y,
        informationWidth
      )

      if (!visits || visits.length === 0) {
        y += 28

        drawTextBlock(
          doc,
          'Service History',
          'No service visits have been recorded for this vehicle.',
          PAGE.marginLeft,
          y,
          PAGE.width -
            PAGE.marginLeft -
            PAGE.marginRight,
          {
            minimumHeight: 30,
            fillColour: PDF_COLOURS.lightGreen,
            borderColour: PDF_COLOURS.green,
          }
        )
      } else {
        y = addContentPage(doc, 'Service History')

        y = drawSectionTitle(
          doc,
          'Complete Service History',
          y
        )

        visits.forEach((visit, index) => {
          y = drawServiceVisit(
            doc,
            visit,
            index + 1,
            visits.length,
            y
          )
        })
      }

      addPageFooters(doc, reportNumber, generatedAt)

      doc.save(`${reportNumber}.pdf`)

      setMessageType('success')
      setMessage(
        `${reportNumber}.pdf was generated successfully.`
      )
    } catch (pdfError) {
      setMessageType('error')
      setMessage(
        `The PDF could not be generated: ${
          pdfError?.message || 'Unknown error'
        }`
      )
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="pdf-report-control">
      <button
        type="button"
        className="pdf-report-button"
        onClick={generatePDF}
        disabled={generating}
      >
        {generating ? (
          <>
            <span className="pdf-report-spinner" />
            Generating Report...
          </>
        ) : (
          <>
            <span className="pdf-report-button-icon">
              PDF
            </span>
            Generate Service Report
          </>
        )}
      </button>

      {message && (
        <div
          className={`pdf-report-message pdf-report-message-${messageType}`}
          role={messageType === 'error' ? 'alert' : 'status'}
        >
          <span>
            {messageType === 'success' ? '✓' : '!'}
          </span>

          <p>{message}</p>
        </div>
      )}
    </div>
  )
}