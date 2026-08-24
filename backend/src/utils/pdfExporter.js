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
 * Format scientific symbols, Greek letters, and LaTeX math expressions for HTML rendering
 */
function formatScientificText(str) {
  if (!str || typeof str !== 'string') return str || '';

  let text = str;

  // Map of common LaTeX Greek letters and scientific symbols to UTF-8 & HTML entities
  const symbolMap = {
    '\\\\theta': 'θ', '\\\\Theta': 'Θ',
    '\\\\omega': 'ω', '\\\\Omega': 'Ω',
    '\\\\alpha': 'α', '\\\\beta': 'β', '\\\\gamma': 'γ', '\\\\Gamma': 'Γ',
    '\\\\delta': 'δ', '\\\\Delta': 'Δ',
    '\\\\epsilon': 'ε', '\\\\varepsilon': 'ε',
    '\\\\lambda': 'λ', '\\\\Lambda': 'Λ',
    '\\\\mu': 'μ', '\\\\nu': 'ν',
    '\\\\pi': 'π', '\\\\Pi': 'Π',
    '\\\\rho': 'ρ', '\\\\sigma': 'σ', '\\\\Sigma': 'Σ',
    '\\\\tau': 'τ', '\\\\phi': 'ϕ', '\\\\varphi': 'ϕ', '\\\\Phi': 'Φ',
    '\\\\psi': 'ψ', '\\\\Psi': 'Ψ',
    '\\\\degree': '°', '\\\\deg': '°',
    '\\\\times': '×', '\\\\cdot': '·', '\\\\div': '÷',
    '\\\\pm': '±', '\\\\mp': '∓',
    '\\\\infty': '∞', '\\\\approx': '≈', '\\\\neq': '≠',
    '\\\\leq': '≤', '\\\\geq': '≥', '\\\\in': '∈', '\\\\rightarrow': '→'
  };

  // Replace LaTeX backslash symbols
  for (const [latex, unicode] of Object.entries(symbolMap)) {
    const escLatex = latex.replace(/\\/g, '\\\\');
    const regex = new RegExp(`${escLatex}(?![a-zA-Z])`, 'g');
    text = text.replace(regex, `<span class="math-symbol">${unicode}</span>`);
  }

  // Handle degree notations like ^\circ or ^{\circ}
  text = text.replace(/\^\{\\circ\}|\^\\circ/g, '°');

  // Handle square roots: \sqrt{...}
  text = text.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

  // Handle fractions: \frac{a}{b}
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="frac"><sup>$1</sup>&frasl;<sub>$2</sub></span>');

  // Handle superscripts: ^{...} or ^...
  text = text.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
  text = text.replace(/\^([\d+\-a-zA-Z]+)/g, '<sup>$1</sup>');

  // Handle subscripts: _{...} or _...
  text = text.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
  text = text.replace(/_([\d+\-a-zA-Z]+)/g, '<sub>$1</sub>');

  // Strip single inline math dollar signs ($ ... $)
  text = text.replace(/\$([^$]+)\$/g, '$1');

  return text;
}

/**
 * Render a single question item cleanly in compact format without question-level marks
 */
function renderQuestionItem(q, numStr, showAnswers) {
  const isMcq = (q.options && q.options.length > 0) || q.type === 'MCQ' || q.questionType === 'MCQ';

  const formattedText = formatScientificText(q.questionText);
  const formattedOptions = (q.options || []).map(opt => formatScientificText(opt));
  const formattedAnswer = formatScientificText(q.answerKey);

  return `
    <div class="question" style="page-break-inside: avoid; break-inside: avoid;">
      <p class="question-text">
        <strong>${numStr}.</strong> ${formattedText}
      </p>
      ${isMcq && formattedOptions.length ? `
        <div class="options">
          ${formattedOptions.map(opt => `<div class="option">${opt}</div>`).join('')}
        </div>
      ` : ''}
      ${showAnswers
        ? `<p class="answer"><strong>Answer Key:</strong> ${formattedAnswer || 'N/A'}</p>`
        : ''
      }
    </div>
  `;
}

/**
 * Dynamic Section Body Renderer with 100% question inclusion, center-aligned section titles,
 * and simplified "Attempt any ___ for __ marks each" instructions.
 */
function buildPatternSections(qp, showAnswers) {
  const patternData = qp.patternData;
  const questionsList = (qp.questions || []).map(q => q.question || q);

  if (!patternData || !Array.isArray(patternData.sections) || !patternData.sections.length) {
    return buildFallbackSections(questionsList, showAnswers);
  }

  let questionPointer = 0;

  const sectionsHtml = patternData.sections.map(sec => {
    let sectionContentHtml = '';

    if (sec.subSections && Array.isArray(sec.subSections)) {
      sectionContentHtml = sec.subSections.map(sub => {
        const count = Number(sub.totalQuestions) || 1;
        const subQs = questionsList.slice(questionPointer, questionPointer + count);
        questionPointer += subQs.length;

        const itemsHtml = subQs.map((q, i) =>
          renderQuestionItem(q, `(${i + 1})`, showAnswers)
        ).join('');

        const attemptCount = sub.questionsToAttempt || sub.totalQuestions || count;
        const markVal = sub.marksPerQuestion || 1;
        const markStr = markVal === 1 ? '1 mark' : `${markVal} marks`;
        const instructionText = `Attempt any ${attemptCount} for ${markStr} each`;

        return `
          <div class="subsection">
            <h4 class="subsection-title"><strong>${sub.questionNumber}. ${sub.title || ''}</strong> (${instructionText})</h4>
            ${sub.note ? `<p class="subsection-note"><em>${sub.note}</em></p>` : ''}
            ${itemsHtml}
          </div>
        `;
      }).join('');
    } else {
      const count = Number(sec.totalQuestions) || 1;
      const secNameUpper = (sec.sectionName || '').toUpperCase();
      let startNum = 1;

      if (secNameUpper.includes('SECTION B')) startNum = 3;
      else if (secNameUpper.includes('SECTION C')) startNum = 15;
      else if (secNameUpper.includes('SECTION D')) startNum = 27;

      const secQs = questionsList.slice(questionPointer, questionPointer + count);
      questionPointer += secQs.length;

      const itemsHtml = secQs.map((q, i) => {
        const label = `Q${startNum + i}`;
        return renderQuestionItem(q, label, showAnswers);
      }).join('');

      const attemptCount = sec.questionsToAttempt || count;
      const markVal = sec.marksPerQuestion || 2;
      const markStr = markVal === 1 ? '1 mark' : `${markVal} marks`;
      const instructionText = `Attempt any ${attemptCount} for ${markStr} each`;

      sectionContentHtml = `
        <div class="section">
          <h3 class="section-title">${sec.sectionName} ${sec.title ? `— ${sec.title}` : ''}</h3>
          <p class="section-info"><strong>${instructionText}</strong>${sec.instructions ? ` | ${sec.instructions}` : ''}</p>
          ${itemsHtml}
        </div>
      `;
      return sectionContentHtml;
    }

    return `
      <div class="section">
        <h3 class="section-title">${sec.sectionName} ${sec.title ? `— ${sec.title}` : ''}</h3>
        ${sectionContentHtml}
      </div>
    `;
  }).join('');

  // Catch-all for any leftover questions if database has more questions than pattern pointer
  let leftoverHtml = '';
  if (questionPointer < questionsList.length) {
    const remainingQs = questionsList.slice(questionPointer);
    const itemsHtml = remainingQs.map((q, i) =>
      renderQuestionItem(q, `Q${questionPointer + i + 1}`, showAnswers)
    ).join('');

    leftoverHtml = `
      <div class="section">
        <h3 class="section-title">Additional Questions</h3>
        ${itemsHtml}
      </div>
    `;
  }

  return sectionsHtml + leftoverHtml;
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
        <p class="section-info"><strong>Attempt any ${mcqs.length} for 1 mark each</strong></p>
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
        <p class="section-info"><strong>Attempt any ${shortAns.length} for 2 marks each</strong></p>
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
        <p class="section-info"><strong>Attempt any ${longAns.length} for 4 marks each</strong></p>
        ${items}
      </div>
    `;
  }

  return html;
}

async function exportQPToPDF(qp, showAnswers = false) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    const examInfo = {
      subject: qp.subject?.name || 'Subject',
      grade: qp.class?.name || qp.grade || 'Class 12th',
      totalMarks: qp.totalMarks,
      durationMins: qp.durationMins,
      difficulty: qp.difficulty,
      date: new Date(qp.createdAt || Date.now()).toLocaleDateString(),
      instructions: qp.instructions
    };

    const letterheadHtml = buildLetterhead(examInfo);
    const bodyHtml = buildPatternSections(qp, showAnswers);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${qp.title}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm 15mm 20mm 15mm;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
          }
          .letterhead {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .letterhead-center {
            text-align: center;
            flex-grow: 1;
          }
          .school-name {
            font-size: 18pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
          }
          .school-info {
            font-size: 9pt;
            margin: 2px 0;
          }
          .divider {
            border: 0;
            border-top: 1.5px solid #000;
            margin: 8px 0;
          }
          .exam-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
          }
          .exam-table td {
            padding: 3px 0;
            width: 33%;
          }
          .instructions {
            font-size: 9.5pt;
            font-style: italic;
            margin: 5px 0;
          }
          .section {
            margin-top: 15px;
          }
          .section-title {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
            margin-top: 15px;
            margin-bottom: 8px;
          }
          .section-info {
            font-size: 9.5pt;
            text-align: center;
            margin-bottom: 10px;
          }
          .subsection-title {
            font-size: 10.5pt;
            margin-top: 10px;
            margin-bottom: 4px;
          }
          .subsection-note {
            font-size: 9pt;
            margin-bottom: 6px;
          }
          .question {
            margin-bottom: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .question-text {
            margin: 0 0 4px 0;
          }
          .options {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 15px;
            padding-left: 20px;
            margin-top: 4px;
          }
          .option {
            font-size: 10pt;
          }
          .answer {
            font-size: 9.5pt;
            color: #1b5e20;
            background-color: #f1f8e9;
            padding: 4px 8px;
            border-left: 3px solid #4caf50;
            margin-top: 4px;
          }
          .math-symbol {
            font-family: 'Cambria Math', 'Times New Roman', serif;
          }
          .frac {
            display: inline-block;
            vertical-align: middle;
            text-align: center;
            font-size: 90%;
          }
          .frac sup {
            display: block;
            border-bottom: 1px solid #000;
            padding: 0 1px;
          }
          .frac sub {
            display: block;
            padding: 0 1px;
          }
        </style>
      </head>
      <body>
        ${letterheadHtml}
        ${bodyHtml}
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
        <div style="font-size: 8pt; font-family: 'Times New Roman'; width: 100%; text-align: center; color: #555; padding-top: 5px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      margin: {
        top: '15mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });

    return pdfBuffer;

  } finally {
    await browser.close();
  }
}

module.exports = {
  exportQPToPDF,
  formatScientificText
};