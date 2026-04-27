/**
 * exportReport.js — Tiện ích xuất báo cáo dạng Excel và PDF
 * Dùng: exceljs (Excel) + pdfkit (PDF)
 */

const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const path = require("path");

// ── Màu sắc branding ──
const BRAND_COLOR = "1E3A5F";       // Navy header
const ACCENT     = "0EA5E9";        // Sky blue accent
const ROW_ALT    = "F0F7FF";        // Row alternating bg

/**
 * generateExcel(data, columns, sheetName) → Promise<Buffer>
 *
 * @param {object[]} data       - Array of row objects
 * @param {{ key, header, width?, numFmt? }[]} columns
 * @param {string} sheetName
 */
async function generateExcel(data, columns, sheetName = "Report") {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Pharmacy WMS";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation: "landscape" },
  });

  // ── Header row ──
  ws.columns = columns.map((c) => ({
    header: c.header,
    key:    c.key,
    width:  c.width ?? 20,
  }));

  // Style header
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND_COLOR } };
    cell.font   = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF" + ACCENT } },
    };
  });
  headerRow.height = 28;

  // ── Data rows ──
  data.forEach((row, idx) => {
    const wsRow = ws.addRow(row);
    if (idx % 2 === 1) {
      wsRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + ROW_ALT } };
      });
    }
    // Apply numFmt if specified
    columns.forEach((col, ci) => {
      if (col.numFmt) wsRow.getCell(ci + 1).numFmt = col.numFmt;
    });
    wsRow.alignment = { vertical: "middle" };
  });

  // Auto-freeze header
  ws.views = [{ state: "frozen", ySplit: 1 }];

  return wb.xlsx.writeBuffer();
}

/**
 * generatePDF(data, title, columns) → Promise<Buffer>
 *
 * @param {object[]} data
 * @param {string}   title
 * @param {{ key, header, width? }[]} columns
 */
async function generatePDF(data, title, columns = []) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
      info: { Title: title, Author: "Pharmacy WMS" },
    });

    doc.on("data",  (c) => chunks.push(c));
    doc.on("end",   () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Font (PDFKit built-in supports ASCII; for Vietnamese we use Helvetica)
    const FONT_NORMAL = "Helvetica";
    const FONT_BOLD   = "Helvetica-Bold";

    // ── Title ──
    doc.font(FONT_BOLD).fontSize(16).fillColor("#1E3A5F")
       .text(title, { align: "center" });
    doc.moveDown(0.3);
    doc.font(FONT_NORMAL).fontSize(9).fillColor("#64748B")
       .text(`Xuất lúc: ${new Date().toLocaleString("vi-VN")}`, { align: "center" });
    doc.moveDown(0.8);

    if (!columns.length || !data.length) {
      doc.font(FONT_NORMAL).fontSize(11).fillColor("#333").text("Không có dữ liệu.");
      doc.end();
      return;
    }

    // ── Table layout ──
    const pageW      = doc.page.width - 80;   // usable width
    const colCount   = columns.length;
    const colWidths  = columns.map((c) => (c.width ? c.width / 100 * pageW : pageW / colCount));
    const rowH       = 20;
    const startX     = 40;
    let   y          = doc.y;

    function drawRow(rowData, isHeader = false) {
      if (y + rowH > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }

      // Background
      doc.rect(startX, y, pageW, rowH)
         .fill(isHeader ? "#1E3A5F" : (rowData.__alt ? "#F0F7FF" : "#FFFFFF"));

      // Text per cell
      let x = startX;
      columns.forEach((col, ci) => {
        const text   = isHeader ? col.header : String(rowData[col.key] ?? "—");
        const cw     = colWidths[ci];
        const color  = isHeader ? "#FFFFFF" : "#1E293B";
        doc.font(isHeader ? FONT_BOLD : FONT_NORMAL)
           .fontSize(isHeader ? 9 : 8)
           .fillColor(color)
           .text(text, x + 4, y + 5, { width: cw - 8, lineBreak: false, ellipsis: true });
        x += cw;
      });

      // Bottom border
      doc.moveTo(startX, y + rowH).lineTo(startX + pageW, y + rowH)
         .strokeColor("#E2E8F0").lineWidth(0.5).stroke();

      y += rowH;
    }

    drawRow(null, true); // header
    data.forEach((row, i) => drawRow({ ...row, __alt: i % 2 === 1 }));

    // Footer
    if (y + 20 < doc.page.height - 40) y += 10;
    doc.font(FONT_NORMAL).fontSize(8).fillColor("#94A3B8")
       .text(`Tổng: ${data.length} dòng`, startX, y);

    doc.end();
  });
}

module.exports = { generateExcel, generatePDF };
