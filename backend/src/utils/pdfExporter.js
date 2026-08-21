const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const LOGO_PATH = path.join(process.cwd(), 'assets', 'logo.jpg');

function getLogoBase64() {
  if (fs.existsSync(LOGO_PATH)) {
    const logo = fs.readFileSync(LOGO_PATH);
    return `data:image/jpeg;base64,${logo.toString('base64')}`;
  }
  return null;
}

// Institutional Letterhead — PRESERVED 100% UNCHANGED
function buildLetterhead(examInfo) {
  const logoBase64 = getLogoBase64();
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" style="height: 80px; width: auto;" />`
    : '';

  return `
    <div class="letterhead">
      <div class="letterhead-left">
        ${logoHtml}
      </div>
      <div class="letterhead-center">
        <h1 class="school-name">${process.env.SCHOOL_NAME || 'School Name'}</h1>
        <p class="school-info">${process.env.SCHOOL_ADDRESS || ''}</p>
        <p class="school-info">
          Phone: ${process.env.SCHOOL_PHONE || ''} | 
          Email: ${process.env.SCHOOL_EMAIL || ''} | 
          Web: ${process.env.SCHOOL_WEBSITE || ''}
        </p>
      </div>
      <div class="letterhead-right"></div>
    </div>
    <hr class="divider" />
    <div class="exam-info">
      <table class="exam-table">
        <tr>
          <td><strong>Subject:</strong> ${examInfo.subject}</td>
          <td><strong>Grade:</strong> ${examInfo.grade || 'N/A'}</td>
          <td><strong>Total Marks:</strong> ${examInfo.totalMarks}</td>
        </tr>
        <tr>
          <td><strong>Date:</strong> ${examInfo.date}</td>
          <td><strong>Duration:</strong> ${examInfo.durationMins} minutes</td>
          <td><strong>Difficulty:</strong> ${examInfo.difficulty}</td>
        </tr>
      </table>
    </div>
    <hr class="divider" />
    ${examInfo.instructions
      ? `<div class="instructions"><strong>Instructions:</strong> ${examInfo.instructions}</div><hr class="divider" />`
      : ''}
  `;
}

/**
 * Render a single question item cleanly
 */
function renderQuestionItem(q, numStr, showAnswers) {
  const isMcq = (q.options && q.options.length > 0) || q.type === 'MCQ' || q.questionType === 'MCQ';

  return `
    <div class="question">
      <p class="question-text">
        <strong>${numStr}.</strong> ${q.questionText} 
        <span class="marks">[${q.marks} ${q.marks === 1 ? 'mark' : 'marks'}]</span>
      </p>
      ${isMcq && q.options?.length ? `
        <div class="options">
          ${q.options.map(opt => `<p class="option">${opt}</p>`).join('')}
        </div>
      ` : ''}
      ${showAnswers
        ? `<p class="answer"><strong>Answer Key:</strong> ${q.answerKey || 'N/A'}</p>`
        : (!isMcq ? `<div class="${q.marks > 3 ? 'answer-space-long' : 'answer-space'}"></div>` : '')
      }
    </div>
  `;
}

/**
 * Dynamic Section Body Renderer supporting Pattern Engine
 */
function buildPatternSections(qp, showAnswers) {
  const patternData = qp.patternData;
  const questionsList = (qp.questions || []).map(q => q.question || q);

  if (!patternData || !Array.isArray(patternData.sections) || !patternData.sections.length) {
    // Fallback if no patternData snapshot is present
    return buildFallbackSections(questionsList, showAnswers);
  }

  let questionGlobalIndex = 0;

  return patternData.sections.map(sec => {
    let sectionContentHtml = '';

    if (sec.subSections && Array.isArray(sec.subSections)) {
      sectionContentHtml = sec.subSections.map(sub => {
        const subQuestions = questionsList.slice(questionGlobalIndex, questionGlobalIndex + sub.totalQuestions);
        questionGlobalIndex += sub.totalQuestions;

        const itemsHtml = subQuestions.map((q, i) =>
          renderQuestionItem(q, `${sub.questionNumber} (${i + 1})`, showAnswers)
        ).join('');

        return `
          <div class="subsection">
            <h4 class="subsection-title"><strong>${sub.questionNumber}. ${sub.title || ''}</strong> (${sub.totalMarks} Marks)</h4>
            ${sub.note ? `<p class="subsection-note"><em>${sub.note}</em></p>` : ''}
            ${itemsHtml}
          </div>
        `;
      }).join('');
    } else {
      const secQuestions = questionsList.slice(questionGlobalIndex, questionGlobalIndex + sec.totalQuestions);
      questionGlobalIndex += sec.totalQuestions;

      const itemsHtml = secQuestions.map((q, i) => {
        let label = `Q${questionGlobalIndex - sec.totalQuestions + i + 1}`;
        if (sec.questionNumberRange) {
          const startNum = parseInt(sec.questionNumberRange.replace(/\D/g, '')) || (questionGlobalIndex - sec.totalQuestions + 1);
          label = `Q${startNum + i}`;
        }
        return renderQuestionItem(q, label, showAnswers);
      }).join('');

      sectionContentHtml = itemsHtml;
    }

    return `
      <div class="section">
        <h3 class="section-title">${sec.sectionName} ${sec.title ? `— ${sec.title}` : ''}</h3>
        ${sec.instructions ? `<p class="section-info">${sec.instructions}</p>` : ''}
        ${sectionContentHtml}
      </div>
    `;
  }).join('');
}

function buildFallbackSections(questions, showAnswers) {
  const mcqs = questions.filter(q => q.options?.length > 0 || q.type === 'MCQ' || q.questionType === 'MCQ');
  const nonMcqs = questions.filter(q => !mcqs.includes(q));

  const shortAns = nonMcqs.filter(q => q.marks <= 3 || q.type === 'SHORT' || q.type === 'VERY_SHORT');
  const longAns = nonMcqs.filter(q => q.marks > 3 || q.type === 'LONG');

  let html = '';

  if (mcqs.length) {
    const items = mcqs.map((q, i) => renderQuestionItem(q, `Q${i + 1}`, showAnswers)).join('');
    html += `
      <div class="section">
        <h3 class="section-title">Section A — Multiple Choice Questions</h3>
        <p class="section-info">Choose the correct option for each question.</p>
        ${items}
      </div>
    `;
  }

  if (shortAns.length) {
    const startIndex = mcqs.length + 1;
    const items = shortAns.map((q, i) => renderQuestionItem(q, `Q${startIndex + i}`, showAnswers)).join('');
    html += `
      <div class="section">
        <h3 class="section-title">Section B — Short Answer Questions</h3>
        <p class="section-info">Answer as required by question marks.</p>
        ${items}
      </div>
    `;
  }

  if (longAns.length) {
    const startIndex = mcqs.length + shortAns.length + 1;
    const items = longAns.map((q, i) => renderQuestionItem(q, `Q${startIndex + i}`, showAnswers)).join('');
    html += `
      <div class="section">
        <h3 class="section-title">Section C — Long Answer Questions</h3>
        <p class="section-info">Answer in detail.</p>
        ${items}
      </div>
    `;
  }

  return html;
}

function buildHTML(qp, showAnswers) {
  const examInfo = {
    subject: qp.subject?.name || 'N/A',
    grade: qp.grade || '',
    totalMarks: qp.totalMarks,
    durationMins: qp.durationMins,
    difficulty: qp.difficulty,
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    instructions: qp.instructions
  };

  const bodySectionsHtml = buildPatternSections(qp, showAnswers);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 13px; color: #000; padding: 30px; }

        /* Letterhead */
        .letterhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .letterhead-center { text-align: center; flex: 1; }
        .letterhead-left { width: 100px; }
        .letterhead-right { width: 100px; }
        .school-name { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .school-info { font-size: 11px; color: #333; margin-top: 3px; }

        /* Dividers */
        .divider { border: none; border-top: 2px solid #000; margin: 8px 0; }

        /* Exam Info */
        .exam-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        .exam-table td { padding: 4px 8px; font-size: 12px; width: 33%; }

        /* Instructions */
        .instructions { font-size: 12px; margin: 6px 0; padding: 4px 8px; background: #f9f9f9; border-left: 3px solid #000; }

        /* Sections */
        .section { margin: 20px 0; }
        .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px; }
        .section-info { font-size: 11px; color: #555; margin-bottom: 12px; font-style: italic; }

        /* Subsections */
        .subsection { margin: 12px 0; }
        .subsection-title { font-size: 13px; font-weight: bold; margin-bottom: 6px; }
        .subsection-note { font-size: 11px; color: #444; margin-bottom: 8px; font-style: italic; }

        /* Questions */
        .question { margin-bottom: 14px; page-break-inside: avoid; }
        .question-text { font-size: 13px; line-height: 1.5; }
        .marks { font-size: 11px; color: #333; font-style: italic; }

        /* Options */
        .options { margin: 6px 0 6px 20px; }
        .option { font-size: 12px; margin: 3px 0; }

        /* Answer Key */
        .answer { margin-top: 6px; font-size: 12px; color: #1a1a8c; background: #f0f0ff; padding: 6px 10px; border-left: 3px solid #1a1a8c; border-radius: 2px; }

        /* Answer spaces for student copy */
        .answer-space { border-bottom: 1px solid #aaa; margin: 6px 0; height: 50px; }
        .answer-space-long { border-bottom: 1px solid #aaa; margin: 6px 0; height: 100px; }

        /* Footer */
        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #555; border-top: 1px solid #000; padding-top: 8px; }

        /* Answer key badge */
        .answer-key-badge { text-align: center; background: #1a1a8c; color: white; padding: 4px; font-size: 12px; font-weight: bold; margin-bottom: 10px; border-radius: 2px; }
      </style>
    </head>
    <body>
      ${buildLetterhead(examInfo)}
      <div class="exam-title" style="text-align:center; font-size:15px; font-weight:bold; margin: 10px 0;">
        ${qp.title}
      </div>
      ${showAnswers ? `<div class="answer-key-badge">⚠️ ANSWER KEY — FOR TEACHER USE ONLY</div>` : ''}
      ${bodySectionsHtml}
      <div class="footer">
        ${process.env.SCHOOL_NAME || ''} | ${process.env.SCHOOL_ADDRESS || ''} | ${process.env.SCHOOL_WEBSITE || ''}
        <br/>*** End of Question Paper ***
      </div>
    </body>
    </html>
  `;
}

async function exportQPToPDF(qp, showAnswers = false) {
  const html = buildHTML(qp, showAnswers);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true
  });

  await browser.close();

  return pdfBuffer;
}

module.exports = { exportQPToPDF };