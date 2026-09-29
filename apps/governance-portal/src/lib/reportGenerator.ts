// ─────────────────────────────────────────────────────────────────────────────
// reportGenerator.ts — Client-side real file generation for Analytics exports
// Generates valid PDF (jsPDF), CSV, and XLSX (SheetJS) files that can be
// opened by standard desktop apps with full Devanagari Hindi & Unicode support.
// ─────────────────────────────────────────────────────────────────────────────

import { ReportTier, ExportFormat, ReportTierConfig } from '@/lib/analyticsData';
import { translateStringToHindi } from '@/utils/translationDictionary';

export interface ReportParams {
  reportId: string;
  title: string;
  tier: ReportTier;
  format: ExportFormat;
  dateRange: string;
  scopeLabel: string;
  generatedBy: string;
  config: ReportTierConfig;
}

function isHindiMode(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('aura-portal-language');
    if (stored === 'hi') return true;
  }
  return false;
}

// ── Shared data rows used in CSV / XLSX ─────────────────────────────────────
function buildDataRows(params: ReportParams, isHindi: boolean): (string | number)[][] {
  const header = isHindi
    ? ['मेट्रिक (Metric)', 'मान (Value)', 'डेल्टा / टिप्पणियाँ (Delta / Notes)']
    : ['Metric', 'Value', 'Delta / Notes'];

  const rows = params.config.keyMetrics.map((km) => [
    isHindi ? translateStringToHindi(km.label) : km.label,
    isHindi ? translateStringToHindi(String(km.value)) : String(km.value),
    isHindi ? (km.delta ? translateStringToHindi(km.delta) : '') : (km.delta ?? ''),
  ]);

  const sectionHeader = isHindi ? 'वैधानिक विश्लेषण अनुभाग (Statutory Sections)' : 'Statutory Sections';
  const sectionRows = params.config.sections.map((sec, i) => [
    isHindi ? `अनुभाग ${i + 1}` : `Section ${i + 1}`,
    isHindi ? translateStringToHindi(sec) : sec,
    '',
  ]);

  return [header, ...rows, [], [sectionHeader, '', ''], ...sectionRows];
}

// ── Helper to wrap text for Canvas 2D ────────────────────────────────────────
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
  return curY + lineHeight;
}

// ── High-DPI Canvas Rendering for Native Devanagari Hindi PDF ────────────────
function renderHindiReportToCanvas(params: ReportParams): HTMLCanvasElement {
  const width = 1240;
  const height = 1754; // A4 @ 150 DPI
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const margin = 70;
  const contentWidth = width - margin * 2;

  // Top Header Blue Bar
  ctx.fillStyle = '#1E40AF';
  ctx.fillRect(0, 0, width, 56);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif';
  ctx.fillText('स्मार्ट स्वास्थ्य एवं आपूर्ति श्रृंखला लचीलापन — गवर्नेंस पोर्टल', margin, 35);

  let y = 110;

  // Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 30px "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif';
  const localizedTitle = translateStringToHindi(params.title);
  ctx.fillText(localizedTitle, margin, y);
  y += 42;

  // Sub-header Metadata
  ctx.fillStyle = '#64748B';
  ctx.font = '16px "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif';
  const localizedTier = translateStringToHindi(params.tier.toUpperCase());
  const localizedPeriod = translateStringToHindi(params.dateRange.toUpperCase());
  const localizedScope = translateStringToHindi(params.scopeLabel);
  ctx.fillText(
    `स्तर: ${localizedTier}  |  अवधि: ${localizedPeriod}  |  दायरा: ${localizedScope}`,
    margin,
    y
  );
  y += 26;

  const localizedGeneratedBy = translateStringToHindi(params.generatedBy);
  const dateStr = new Date().toLocaleString('hi-IN');
  ctx.fillText(
    `जनरेटेड द्वारा: ${localizedGeneratedBy}  |  रिपोर्ट आईडी: ${params.reportId}  |  दिनांक: ${dateStr}`,
    margin,
    y
  );
  y += 30;

  // Dividing line
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(width - margin, y);
  ctx.stroke();
  y += 32;

  // Subtitle / Description
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 17px "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif';
  const localizedSubtitle = translateStringToHindi(params.config.subtitle);
  y = wrapCanvasText(ctx, localizedSubtitle, margin, y, contentWidth, 26);
  y += 18;

  // Section: Key Performance Metrics
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 20px "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif';
  ctx.fillText('प्रमुख प्रदर्शन मेट्रिक्स (KEY PERFORMANCE METRICS)', margin, y);
  y += 24;

  params.config.keyMetrics.forEach((km, i) => {
    const rowY = y;
    if (i % 2 === 0) {
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(margin, rowY - 18, contentWidth, 42);
    }

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif';
    ctx.fillText(translateStringToHindi(km.label), margin + 14, rowY + 9);

    ctx.fillStyle = '#2563EB';
    ctx.font = 'bold 17px "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif';
    ctx.fillText(translateStringToHindi(String(km.value)), margin + 480, rowY + 9);

    if (km.delta) {
      ctx.fillStyle = '#64748B';
      ctx.font = '15px "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif';
      ctx.fillText(translateStringToHindi(km.delta), margin + 740, rowY + 9);
    }

    y += 44;
  });

  y += 24;

  // Dividing line
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(width - margin, y);
  ctx.stroke();
  y += 32;

  // Section: Statutory Analysis Sections
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 20px "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif';
  ctx.fillText('वैधानिक विश्लेषण अनुभाग (STATUTORY ANALYSIS SECTIONS)', margin, y);
  y += 28;

  params.config.sections.forEach((sec, i) => {
    ctx.fillStyle = '#334155';
    ctx.font = '16px "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif';
    const localizedSec = `${i + 1}. ${translateStringToHindi(sec)}`;
    y = wrapCanvasText(ctx, localizedSec, margin + 10, y, contentWidth - 20, 26);
    y += 8;
  });

  // Footer Disclaimer
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin, height - 70);
  ctx.lineTo(width - margin, height - 70);
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = '13px "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif';
  ctx.fillText(
    'यह दस्तावेज़ ऑरा वांटेज गवर्नेंस पोर्टल द्वारा स्वचालित रूप से जनरेट किया गया है। केवल आधिकारिक उपयोग के लिए।',
    margin,
    height - 42
  );

  return canvas;
}

// ── PDF generation via jsPDF ─────────────────────────────────────────────────
export async function generatePDF(params: ReportParams): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const isHindi = isHindiMode() || /[\u0900-\u097F]/.test(params.title);

  if (isHindi) {
    const canvas = renderHindiReportToCanvas(params);
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    doc.addImage(imgData, 'PNG', 0, 0, 210, 297);
    return doc.output('blob');
  }

  // English fallback with vector text
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 22;

  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageW, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SMART HEALTH & SUPPLY CHAIN RESILIENCE — GOVERNANCE PORTAL', margin, 9.5);

  y = 26;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(params.title, margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Tier: ${params.tier.toUpperCase()}  |  Period: ${params.dateRange.toUpperCase()}  |  Scope: ${params.scopeLabel}`,
    margin, y
  );
  y += 5;
  doc.text(`Generated by: ${params.generatedBy}  |  Report ID: ${params.reportId}  |  Date: ${new Date().toLocaleString()}`, margin, y);
  y += 6;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(71, 85, 105);
  const subtitleLines = doc.splitTextToSize(params.config.subtitle, pageW - margin * 2);
  doc.text(subtitleLines, margin, y);
  y += subtitleLines.length * 5 + 6;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('KEY PERFORMANCE METRICS', margin, y);
  y += 7;

  params.config.keyMetrics.forEach((km, i) => {
    const rowY = y + i * 12;
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY - 4, pageW - margin * 2, 11, 'F');
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(km.label, margin + 3, rowY + 3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(37, 99, 235);
    doc.text(String(km.value), margin + 90, rowY + 3);
    if (km.delta) {
      doc.setTextColor(100, 116, 139);
      doc.text(km.delta, margin + 140, rowY + 3);
    }
  });

  y += params.config.keyMetrics.length * 12 + 8;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('STATUTORY ANALYSIS SECTIONS', margin, y);
  y += 7;

  params.config.sections.forEach((sec, i) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(`${i + 1}. ${sec}`, pageW - margin * 2 - 4);
    doc.text(lines, margin + 3, y);
    y += lines.length * 5 + 2;
  });

  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This document is auto-generated by the AURA Vantage Governance Portal. For official use only.', margin, y);

  return doc.output('blob');
}

// ── CSV generation ───────────────────────────────────────────────────────────
export function generateCSV(params: ReportParams): Blob {
  const isHindi = isHindiMode() || /[\u0900-\u097F]/.test(params.title);
  const rows = buildDataRows(params, isHindi);
  const meta = isHindi
    ? [
        ['स्मार्ट स्वास्थ्य एवं आपूर्ति श्रृंखला लचीलापन - गवर्नेंस रिपोर्ट'],
        ['रिपोर्ट शीर्षक', translateStringToHindi(params.title)],
        ['रिपोर्ट आईडी', params.reportId],
        ['स्तर', translateStringToHindi(params.tier.toUpperCase())],
        ['अवधि', translateStringToHindi(params.dateRange.toUpperCase())],
        ['दायरा', translateStringToHindi(params.scopeLabel)],
        ['जनरेटेड द्वारा', translateStringToHindi(params.generatedBy)],
        ['जनरेटेड दिनांक', new Date().toISOString()],
        [],
      ]
    : [
        ['Smart Health & Supply Chain Resilience - Governance Report'],
        ['Report Title', params.title],
        ['Report ID', params.reportId],
        ['Tier', params.tier.toUpperCase()],
        ['Period', params.dateRange.toUpperCase()],
        ['Scope', params.scopeLabel],
        ['Generated By', params.generatedBy],
        ['Generated At', new Date().toISOString()],
        [],
      ];

  const allRows = [...meta, ...rows];
  const csv = allRows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');
  return new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
}

// ── XLSX generation via SheetJS ──────────────────────────────────────────────
export async function generateXLSX(params: ReportParams): Promise<Blob> {
  const isHindi = isHindiMode() || /[\u0900-\u097F]/.test(params.title);
  const XLSX = await import('xlsx');
  const ws_data: (string | number)[][] = isHindi
    ? [
        ['स्मार्ट स्वास्थ्य एवं आपूर्ति श्रृंखला लचीलापन - गवर्नेंस रिपोर्ट'],
        [],
        ['रिपोर्ट शीर्षक', translateStringToHindi(params.title)],
        ['रिपोर्ट आईडी', params.reportId],
        ['स्तर', translateStringToHindi(params.tier.toUpperCase())],
        ['अवधि', translateStringToHindi(params.dateRange.toUpperCase())],
        ['दायरा', translateStringToHindi(params.scopeLabel)],
        ['जनरेटेड द्वारा', translateStringToHindi(params.generatedBy)],
        ['जनरेटेड दिनांक', new Date().toLocaleString('hi-IN')],
        [],
        ['प्रमुख मेट्रिक्स (KEY METRICS)'],
        ['मेट्रिक', 'मान', 'डेल्टा / टिप्पणियाँ'],
        ...params.config.keyMetrics.map((km) => [
          translateStringToHindi(km.label),
          translateStringToHindi(String(km.value)),
          km.delta ? translateStringToHindi(km.delta) : '',
        ]),
        [],
        ['वैधानिक विश्लेषण अनुभाग (STATUTORY ANALYSIS SECTIONS)'],
        ['#', 'अनुभाग विवरण'],
        ...params.config.sections.map((sec, i) => [i + 1, translateStringToHindi(sec)]),
      ]
    : [
        ['Smart Health & Supply Chain Resilience - Governance Report'],
        [],
        ['Report Title', params.title],
        ['Report ID', params.reportId],
        ['Tier', params.tier.toUpperCase()],
        ['Period', params.dateRange.toUpperCase()],
        ['Scope', params.scopeLabel],
        ['Generated By', params.generatedBy],
        ['Generated At', new Date().toLocaleString()],
        [],
        ['KEY METRICS'],
        ['Metric', 'Value', 'Delta / Notes'],
        ...params.config.keyMetrics.map((km) => [km.label, String(km.value), km.delta ?? '']),
        [],
        ['STATUTORY ANALYSIS SECTIONS'],
        ['#', 'Section Description'],
        ...params.config.sections.map((sec, i) => [i + 1, sec]),
      ];

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [{ wch: 45 }, { wch: 35 }, { wch: 35 }];
  const wb = XLSX.utils.book_new();
  const sheetName = isHindi ? `${translateStringToHindi(params.tier.toUpperCase())} रिपोर्ट` : `${params.tier.toUpperCase()} Report`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ── Master dispatcher ────────────────────────────────────────────────────────
export async function generateReport(params: ReportParams): Promise<string> {
  let blob: Blob;
  switch (params.format) {
    case 'PDF':
      blob = await generatePDF(params);
      break;
    case 'CSV':
      blob = generateCSV(params);
      break;
    case 'XLSX':
      blob = await generateXLSX(params);
      break;
    default:
      throw new Error(`Unknown format: ${params.format}`);
  }
  return URL.createObjectURL(blob);
}
