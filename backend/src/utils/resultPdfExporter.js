const puppeteer = require('puppeteer');

/**
 * Generate a clean, professional PDF result sheet for Test Results
 */
async function generateResultPdf(qp, results) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    const totalStudents = results.length;
    const passedCount = results.filter(r => r.isPassed).length;
    const failedCount = totalStudents - passedCount;
    const avgScore = totalStudents > 0
      ? (results.reduce((sum, r) => sum + (Number(r.obtainedMarks) || 0), 0) / totalStudents).toFixed(1)
      : 0;

    const rowsHtml = results.map((r, i) => {
      const studentName = r.student?.user?.name || 'N/A';
      const studentId = r.student?.uniqueId || r.student?.id || 'N/A';
      const className = r.student?.class?.name || 'N/A';
      const obtained = Number(r.obtainedMarks) || 0;
      const maxMarks = qp.totalMarks || 100;
      const pct = ((obtained / maxMarks) * 100).toFixed(1);
      const isPassed = r.isPassed;

      return `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td><strong>${studentName}</strong></td>
          <td style="text-align: center;">${studentId}</td>
          <td style="text-align: center;">${className}</td>
          <td style="text-align: center;"><strong>${obtained}</strong> / ${maxMarks}</td>
          <td style="text-align: center;">${pct}%</td>
          <td style="text-align: center;">
            <span class="status-badge ${isPassed ? 'status-pass' : 'status-fail'}">
              ${isPassed ? 'PASS' : 'FAIL'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Result Sheet - ${qp.title}</title>
        <style>
          @page { size: A4; margin: 12mm 15mm 15mm 15mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #222; margin: 0; padding: 0; }
          .header { text-align: center; border-bottom: 2px solid #1F4E79; padding-bottom: 8px; margin-bottom: 15px; }
          .school-name { font-size: 18pt; font-weight: bold; color: #1F4E79; text-transform: uppercase; margin: 0; }
          .sub-title { font-size: 11pt; color: #555; margin: 3px 0 0 0; }
          .exam-title { font-size: 14pt; font-weight: bold; margin-top: 10px; color: #000; text-align: center; }
          .meta-grid { display: flex; justify-content: space-between; background: #F2F4F7; padding: 10px 15px; border-radius: 6px; margin-bottom: 15px; font-size: 9.5pt; }
          .stats-grid { display: flex; justify-content: space-around; background: #EBF3FA; border: 1px solid #B8D5E5; padding: 10px; border-radius: 6px; margin-bottom: 15px; text-align: center; }
          .stat-box { flex: 1; }
          .stat-val { font-size: 14pt; font-weight: bold; color: #1F4E79; }
          .stat-lbl { font-size: 8pt; color: #666; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9.5pt; }
          th { background-color: #1F4E79; color: #FFFFFF; font-weight: bold; text-transform: uppercase; padding: 8px; font-size: 8.5pt; border: 1px solid #1F4E79; }
          td { padding: 7px 8px; border: 1px solid #D1D5DB; }
          tr:nth-child(even) { background-color: #F9FAFB; }
          .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 8.5pt; font-weight: bold; }
          .status-pass { background-color: #DEF7EC; color: #03543F; }
          .status-fail { background-color: #FDE8E8; color: #9B1C1C; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="school-name">QPGen Educational Portal</h1>
          <p class="sub-title">Official Examination & Assessment Result Sheet</p>
        </div>

        <div class="exam-title">${qp.title}</div>

        <div class="meta-grid">
          <div><strong>Subject:</strong> ${qp.subject?.name || 'N/A'}</div>
          <div><strong>Total Marks:</strong> ${qp.totalMarks}</div>
          <div><strong>Duration:</strong> ${qp.durationMins} Mins</div>
          <div><strong>Exam Date:</strong> ${qp.examDate ? new Date(qp.examDate).toLocaleDateString() : new Date(qp.createdAt).toLocaleDateString()}</div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-val">${totalStudents}</div>
            <div class="stat-lbl">Total Students</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color: #03543F;">${passedCount}</div>
            <div class="stat-lbl">Passed</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color: #9B1C1C;">${failedCount}</div>
            <div class="stat-lbl">Failed</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${avgScore}</div>
            <div class="stat-lbl">Avg Score</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 6%;">#</th>
              <th>Student Name</th>
              <th style="width: 15%;">Student ID</th>
              <th style="width: 15%;">Class</th>
              <th style="width: 18%;">Obtained</th>
              <th style="width: 12%;">Pct (%)</th>
              <th style="width: 12%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 8pt; font-family: sans-serif; width: 100%; text-align: center; color: #777;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      margin: { top: '12mm', bottom: '15mm', left: '15mm', right: '15mm' }
    });

    return pdfBuffer;

  } finally {
    await browser.close();
  }
}

module.exports = { generateResultPdf };
