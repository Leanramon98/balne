/**
 * Export utilities for evaluation indicator tables.
 * Supports: clipboard (TSV), Excel (xlsx), PDF (html2canvas + jspdf)
 */

/**
 * Formats an array of records as TSV and copies it to the clipboard.
 */
export async function exportToClipboard(data: Record<string, any>[], columns: string[]): Promise<void> {
  const header = columns.join('\t');
  const rows = data.map((row) => columns.map((col) => String(row[col] ?? '')).join('\t'));
  const tsv = [header, ...rows].join('\n');

  await navigator.clipboard.writeText(tsv);
}

/**
 * Generates an Excel file from the given data and triggers a download.
 */
export async function exportToExcel(data: Record<string, any>[], filename: string): Promise<void> {
  const XLSX = await import('xlsx');

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Captures a DOM element by its ID as a PDF and triggers a download.
 */
export async function exportToPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF('p', 'mm', 'a4');
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdf.internal.pageSize.getHeight();

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();
  }

  pdf.save(`${filename}.pdf`);
}
