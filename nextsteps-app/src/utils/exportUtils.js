import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const exportCSV = (headers, rows, filename = 'export.csv') => {
  const escape = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

export const exportExcel = (sheets, filename = 'export.xlsx') => {
  const wb = XLSX.utils.book_new()
  sheets.forEach(({ name, headers, rows }) => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
  })
  XLSX.writeFile(wb, filename)
}

export const exportTableExcel = (headers, rows, filename = 'export.xlsx', sheetName = 'Data') => {
  exportExcel([{ name: sheetName, headers, rows }], filename)
}

export const exportPDFTable = ({
  title,
  subtitle,
  headers,
  rows,
  filename = 'export.pdf',
  orientation = 'portrait',
}) => {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  doc.setFontSize(18)
  doc.text(title, 14, 20)
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(subtitle, 14, 28)
    doc.setTextColor(0)
  }
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: subtitle ? 34 : 28,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [67, 97, 238] },
  })
  doc.save(filename)
}

export const exportChatPDF = ({ title, messages, filename = 'chat-export.pdf' }) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Exported ${new Date().toLocaleString()}`, 14, 26)
  doc.setTextColor(0)

  let y = 34
  const pageHeight = doc.internal.pageSize.height
  const margin = 14
  const maxWidth = doc.internal.pageSize.width - margin * 2

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'You' : 'AI Helper'
    const text = `${role}: ${msg.message || msg.content || ''}`
    const lines = doc.splitTextToSize(text, maxWidth)
    if (y + lines.length * 5 > pageHeight - 20) {
      doc.addPage()
      y = 20
    }
    doc.setFont(undefined, msg.role === 'user' ? 'normal' : 'bold')
    doc.text(lines, margin, y)
    y += lines.length * 5 + 4
  })
  doc.save(filename)
}

export const copyToClipboard = async (text) => {
  await navigator.clipboard.writeText(text)
}
