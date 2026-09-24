import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface InvoicePdfData {
  invoiceNumber: string
  issueDate: string
  dueDate: string | null
  business: {
    name: string
    email: string
    phone: string
    address: string
    bankName: string
    bankAccountName: string
    bankAccountNumber: string
  }
  client: {
    name: string
    company: string
    email: string
  }
  lineItems: { description: string, amount: number }[]
  subtotal: number
  total: number
  currency: string
  notes: string
}

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toFixed(2)}`
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89]) // A4
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const margin = 50
  let y = 800

  const dark = rgb(0.13, 0.13, 0.13)
  const gray = rgb(0.45, 0.45, 0.45)
  const line = rgb(0.85, 0.85, 0.85)

  function text(str: string, x: number, yPos: number, opts: { size?: number, bold?: boolean, color?: ReturnType<typeof rgb> } = {}) {
    page.drawText(str, {
      x,
      y: yPos,
      size: opts.size ?? 10,
      font: opts.bold ? fontBold : font,
      color: opts.color ?? dark
    })
  }

  // Header
  text('INVOICE', margin, y, { size: 24, bold: true })
  text(data.invoiceNumber, margin, y - 22, { size: 11, color: gray })

  // Business info (right aligned block, simple left-anchored since pdf-lib has no auto text width for right align without measuring)
  const rightX = 350
  text(data.business.name || 'Your Business Name', rightX, y, { bold: true })
  text(data.business.email || '', rightX, y - 14, { size: 9, color: gray })
  text(data.business.phone || '', rightX, y - 26, { size: 9, color: gray })
  const addressLines = (data.business.address || '').split('\n').filter(Boolean)
  let addrY = y - 38
  for (const l of addressLines) {
    text(l, rightX, addrY, { size: 9, color: gray })
    addrY -= 12
  }

  y -= 70

  // Divider
  page.drawLine({ start: { x: margin, y }, end: { x: 545, y }, thickness: 1, color: line })
  y -= 25

  // Bill to / dates
  text('BILL TO', margin, y, { size: 9, color: gray, bold: true })
  text('ISSUE DATE', rightX, y, { size: 9, color: gray, bold: true })
  text('DUE DATE', rightX + 100, y, { size: 9, color: gray, bold: true })
  y -= 15

  text(data.client.name, margin, y, { bold: true })
  text(data.issueDate, rightX, y)
  text(data.dueDate ?? '-', rightX + 100, y)
  y -= 14

  if (data.client.company) {
    text(data.client.company, margin, y, { size: 9, color: gray })
    y -= 14
  }
  if (data.client.email) {
    text(data.client.email, margin, y, { size: 9, color: gray })
    y -= 14
  }

  y -= 20

  // Line items table header
  page.drawRectangle({ x: margin, y: y - 5, width: 495, height: 22, color: rgb(0.96, 0.96, 0.96) })
  text('DESCRIPTION', margin + 8, y, { size: 9, bold: true, color: gray })
  text('AMOUNT', 480, y, { size: 9, bold: true, color: gray })
  y -= 30

  for (const item of data.lineItems) {
    text(item.description, margin + 8, y, { size: 10 })
    text(formatMoney(item.amount, data.currency), 470, y, { size: 10 })
    y -= 20
    page.drawLine({ start: { x: margin, y: y + 8 }, end: { x: 545, y: y + 8 }, thickness: 0.5, color: line })
  }

  y -= 10

  // Totals
  text('Subtotal', 400, y, { size: 10, color: gray })
  text(formatMoney(data.subtotal, data.currency), 470, y, { size: 10 })
  y -= 18

  page.drawLine({ start: { x: 400, y: y + 10 }, end: { x: 545, y: y + 10 }, thickness: 1, color: line })
  text('TOTAL', 400, y - 5, { size: 12, bold: true })
  text(formatMoney(data.total, data.currency), 460, y - 5, { size: 12, bold: true })
  y -= 50

  // Payment info
  if (data.business.bankName || data.business.bankAccountNumber) {
    text('PAYMENT DETAILS', margin, y, { size: 9, bold: true, color: gray })
    y -= 15
    if (data.business.bankName) {
      text(`Bank: ${data.business.bankName}`, margin, y, { size: 9 })
      y -= 13
    }
    if (data.business.bankAccountName) {
      text(`Account Name: ${data.business.bankAccountName}`, margin, y, { size: 9 })
      y -= 13
    }
    if (data.business.bankAccountNumber) {
      text(`Account Number: ${data.business.bankAccountNumber}`, margin, y, { size: 9 })
      y -= 13
    }
    y -= 15
  }

  if (data.notes) {
    text('NOTES', margin, y, { size: 9, bold: true, color: gray })
    y -= 15
    const noteLines = data.notes.split('\n')
    for (const l of noteLines) {
      text(l, margin, y, { size: 9, color: gray })
      y -= 13
    }
  }

  return doc.save()
}
