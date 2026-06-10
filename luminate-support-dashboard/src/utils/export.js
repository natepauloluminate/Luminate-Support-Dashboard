import { metrics } from '../data/mockData';

export function exportCSV() {
  const rows = [
    ['Metric', 'Value'],
    ['Tickets Opened Today',  metrics.ticketsOpenedToday.value],
    ['Tickets Closed Today',  metrics.ticketsClosedToday.value],
    ['Tickets Per Hour',      metrics.ticketsPerHour.value],
    ['Tickets Per Day',       metrics.ticketsPerDay.value],
    ['Response Time',         metrics.responseTime.value],
    ['Resolution Time',       metrics.resolutionTime.value],
    ['Total Tickets',         metrics.totalTickets.value],
    ['Total New',             metrics.totalNew.value],
    ['Total Closed',          metrics.totalClosed.value],
    ['Total In-Progress',     metrics.totalInProgress.value],
    ['Techs Online',          metrics.techsOnline.join('; ') || 'none'],
    ['Techs Out of Office',   metrics.techsOOO.join('; ')    || 'none'],
  ];
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'luminate-support.csv' });
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportPDF(elementId = 'dashboard-root') {
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF }       = await import('jspdf');
  const el     = document.getElementById(elementId);
  const canvas = await html2canvas(el, { backgroundColor: '#0B1220', scale: 1.5, useCORS: true });
  const img    = canvas.toDataURL('image/png');
  const pdf    = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width / 1.5, canvas.height / 1.5],
  });
  pdf.addImage(img, 'PNG', 0, 0, canvas.width / 1.5, canvas.height / 1.5);
  pdf.save('Luminate-Support-Dashboard.pdf');
}
