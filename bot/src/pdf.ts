import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface RecordItem {
  date: string
  category?: { name: string }
  description?: string | null
  amount: number
  status: 'paid' | 'pending'
  payment_method: string
  dimensions?: { width?: number; height?: number; thickness?: number } | null
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr))
}

export function generateReport(clientName: string, records: RecordItem[]): string {
  const lines: string[] = []
  const totalPaid = records.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)
  const totalPending = records.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0)

  lines.push(`Замовник: ${clientName}`)
  lines.push(`Дата звіту: ${formatDate(new Date().toISOString())}`)
  lines.push('')
  lines.push('── Виконані роботи ──')

  records.forEach((r, i) => {
    const dim = r.dimensions
      ? ` [${[r.dimensions.width, r.dimensions.height, r.dimensions.thickness].filter(Boolean).join('×')} см]`
      : ''
    lines.push(`${i + 1}. ${formatDate(r.date)} — ${r.category?.name ?? 'Робота'}${dim}`)
    if (r.description) lines.push(`   ${r.description}`)
    lines.push(`   ${formatMoney(r.amount)} [${r.status === 'paid' ? '✓ Оплачено' : '⏳ Очікує'}]`)
  })

  lines.push('')
  lines.push(`Оплачено: ${formatMoney(totalPaid)}`)
  lines.push(`Очікує оплати: ${formatMoney(totalPending)}`)
  lines.push(`Загалом: ${formatMoney(totalPaid + totalPending)}`)

  return lines.join('\n')
}

export async function generatePdfReport(clientName: string, records: RecordItem[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const totalPaid = records.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)
  const totalPending = records.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0)

  let y = height - 50

  // Header
  page.drawText('РАХУНОК / ЗВІТ', { x: 50, y, size: 18, font: fontBold, color: rgb(0.09, 0.51, 0.8) })
  y -= 25
  page.drawText(`Замовник: ${clientName}`, { x: 50, y, size: 11, font })
  y -= 16
  page.drawText(`Дата: ${formatDate(new Date().toISOString())}`, { x: 50, y, size: 11, font })
  y -= 20

  // Divider
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 20

  // Table header
  page.drawText('Дата', { x: 50, y, size: 10, font: fontBold })
  page.drawText('Робота', { x: 130, y, size: 10, font: fontBold })
  page.drawText('Сума', { x: 380, y, size: 10, font: fontBold })
  page.drawText('Статус', { x: 460, y, size: 10, font: fontBold })
  y -= 15

  // Records
  for (const r of records) {
    if (y < 100) {
      // Add new page if needed
      const newPage = doc.addPage([595, 842])
      y = 800
    }

    const dateStr = new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(r.date))
    const catName = r.category?.name ?? 'Робота'
    const dim = r.dimensions
      ? ` ${[r.dimensions.width, r.dimensions.height, r.dimensions.thickness].filter(Boolean).join('×')}см`
      : ''

    page.drawText(dateStr, { x: 50, y, size: 9, font })
    page.drawText((catName + dim).slice(0, 38), { x: 130, y, size: 9, font })
    page.drawText(formatMoney(r.amount), { x: 380, y, size: 9, font })
    page.drawText(r.status === 'paid' ? 'Оплачено' : 'Очікує', { x: 460, y, size: 9, font, color: r.status === 'paid' ? rgb(0.1, 0.6, 0.3) : rgb(0.9, 0.5, 0.1) })

    if (r.description) {
      y -= 12
      page.drawText(`  ${r.description.slice(0, 70)}`, { x: 130, y, size: 8, font, color: rgb(0.5, 0.5, 0.5) })
    }
    y -= 15
  }

  // Totals
  y -= 10
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 18
  page.drawText(`Оплачено: ${formatMoney(totalPaid)}`, { x: 380, y, size: 10, font, color: rgb(0.1, 0.6, 0.3) })
  y -= 15
  page.drawText(`Очікує: ${formatMoney(totalPending)}`, { x: 380, y, size: 10, font, color: rgb(0.9, 0.5, 0.1) })
  y -= 15
  page.drawText(`Загалом: ${formatMoney(totalPaid + totalPending)}`, { x: 380, y, size: 11, font: fontBold })

  return doc.save()
}
