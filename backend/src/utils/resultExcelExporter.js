const ExcelJS = require('exceljs');

/**
 * Generate a clean, professional Excel Spreadsheet (.xlsx) for Test Results
 */
async function generateResultExcel(qp, results) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'QPGen System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Test Results', {
    pageSetup: { paperSize: 9, orientation: 'landscape' }
  });

  // Title & Header Block
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `EXAMINATION RESULT SHEET — ${qp.title}`;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: '1F4E79' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:G2');
  const subTitleCell = worksheet.getCell('A2');
  subTitleCell.value = `Subject: ${qp.subject?.name || 'Subject'} | Max Marks: ${qp.totalMarks} | Duration: ${qp.durationMins} Mins | Date: ${qp.examDate ? new Date(qp.examDate).toLocaleDateString() : new Date(qp.createdAt).toLocaleDateString()}`;
  subTitleCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: '595959' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]); // Blank line

  // Column Headers
  const headerRow = worksheet.addRow([
    'Sr No.',
    'Student Name',
    'Student ID',
    'Class / Division',
    'Obtained Marks',
    'Max Marks',
    'Percentage (%)',
    'Status'
  ]);

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1F4E79' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });

  // Data Rows
  results.forEach((r, idx) => {
    const studentName = r.student?.user?.name || 'N/A';
    const studentUniqueId = r.student?.uniqueId || r.student?.id || 'N/A';
    const className = r.student?.class?.name || 'N/A';
    const obtained = Number(r.obtainedMarks) || 0;
    const maxMarks = qp.totalMarks || 100;
    const percentage = Number(((obtained / maxMarks) * 100).toFixed(2));
    const statusStr = r.isPassed ? 'PASS' : 'FAIL';

    const row = worksheet.addRow([
      idx + 1,
      studentName,
      studentUniqueId,
      className,
      obtained,
      maxMarks,
      `${percentage}%`,
      statusStr
    ]);

    // Format Data Row
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'D9D9D9' } },
        left: { style: 'thin', color: { argb: 'D9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
        right: { style: 'thin', color: { argb: 'D9D9D9' } }
      };

      if (colNumber === 1 || colNumber === 3 || colNumber === 4 || colNumber === 5 || colNumber === 6 || colNumber === 7) {
        cell.alignment = { horizontal: 'center' };
      }

      // Status Coloring
      if (colNumber === 8) {
        cell.alignment = { horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 10, bold: true };
        if (statusStr === 'PASS') {
          cell.font.color = { argb: '276A3C' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2F0D9' } };
        } else {
          cell.font.color = { argb: 'C00000' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCE4D6' } };
        }
      }
    });
  });

  // Adjust Column Widths
  worksheet.columns.forEach((col) => {
    let maxLen = 12;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 4, 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { generateResultExcel };
