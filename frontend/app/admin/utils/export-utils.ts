import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToJSON = (
  data: Record<string, unknown>[],
  filename: string
) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (
  data: Record<string, unknown>[],
  filename: string,
  headers?: string[]
) => {
  const csvHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);
  const csvContent = [
    csvHeaders.join(','),
    ...data.map((row) =>
      csvHeaders
        .map((header) => `"${String(row[header] || '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (
  data: Record<string, unknown>[],
  filename: string,
  title: string,
  headers?: string[]
) => {
  const doc = new jsPDF();
  const pdfHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);

  doc.setFontSize(16);
  doc.text(title, 14, 20);

  const tableData = data.map((row) =>
    pdfHeaders.map((header) => String(row[header] || ''))
  );

  autoTable(doc, {
    head: [pdfHeaders],
    body: tableData,
    startY: 30,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [0, 134, 71] },
  });

  doc.save(filename);
};
