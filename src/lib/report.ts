import jsPDF from 'jspdf';
import { Language, translations } from '@/lib/translations';

export const generateMultilingualReport = (langs: Language[], prescriptionText: string) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MediLingo Prescription Report', 40, y);
  y += 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);
  y += 24;

  langs.forEach((lang, idx) => {
    const t = translations[lang];
    if (idx > 0) {
      doc.addPage();
      y = 40;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${t.nav.appName} - ${lang.toUpperCase()}`, 40, y);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const text = `${t.dashboard.title}\n${prescriptionText || 'Prescription details will appear here.'}`;
    const lines = doc.splitTextToSize(text, 520);
    doc.text(lines, 40, y);
  });

  doc.save('medilingo-report.pdf');
};
