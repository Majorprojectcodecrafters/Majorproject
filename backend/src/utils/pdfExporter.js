const path = require('path');
const fs = require('fs');
const katex = require('katex');

const LOGO_PATH = path.join(process.cwd(), 'assets', 'logo.jpg');

let browserPromise = null;

async function getSharedBrowser() {
  if (!browserPromise) {
    const puppeteer = require('puppeteer');
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }).catch(err => {
      browserPromise = null;
      throw err;
    });
  }
  const browser = await browserPromise;
  if (!browser.connected) {
    browserPromise = null;
    return getSharedBrowser();
  }
  return browser;
}

let cachedKatexCss = null;

function getKatexCss() {
  if (!cachedKatexCss) {
    try {
      const katexCssPath = require.resolve('katex/dist/katex.min.css');
      cachedKatexCss = fs.readFileSync(katexCssPath, 'utf8');
    } catch (e) {
      cachedKatexCss = '';
    }
  }
  return cachedKatexCss;
}

const pdfCache = new Map();
const MAX_CACHE_SIZE = 50;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getPdfCacheKey(qp, showAnswers) {
  const qpId = qp.id || qp._id || 'qp';
  const updatedAt = qp.updatedAt || qp.createdAt || '';
  const qCount = (qp.questions || []).length;
  return `${qpId}_${updatedAt}_${qCount}_${showAnswers ? 'ans' : 'noans'}`;
}

function clearPdfCache(qpId) {
  if (!qpId) {
    pdfCache.clear();
    return;
  }
  for (const key of pdfCache.keys()) {
    if (key.startsWith(`${qpId}_`)) {
      pdfCache.delete(key);
    }
  }
}

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
    ? `<img src="${logoBase64}" style="height: 70px; width: auto;" />`
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
 * Format scientific symbols, TeX/LaTeX expressions, chemical compounds, and math using KaTeX
 */
function formatScientificText(str) {
  if (!str || typeof str !== 'string') return str || '';

  let text = str;

  // 1. Clean literal escaped newlines and string garbage
  text = text.replace(/\\r\\n|\\n\\r|\\n|\\r/g, '\n');

  // 2. Normalize double backslashes in TeX commands (e.g. \\text -> \text, \\frac -> \frac)
  text = text.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // 3. Render explicit LaTeX delimiters ($...$, $$...$$, \(...\), \[...\])
  text = text.replace(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$|\\\(.+?\\\)|\\\[.+?\\\])/g, (match) => {
    const isDisplay = match.startsWith('$$') || match.startsWith('\\[');
    const cleanMath = match
      .replace(/^\$\$|^\$|^\\\(|^\\\[/g, '')
      .replace(/\$\$$|\$$|\\\)$|\\\]$/g, '')
      .trim();

    try {
      return katex.renderToString(cleanMath, {
        displayMode: isDisplay,
        throwOnError: false
      });
    } catch (e) {
      return match;
    }
  });

  // 4. Auto-wrap standalone un-delimited TeX expressions (e.g. \text{H}_2\text{O}, \frac{a}{b}, \ce{H2O}, \Delta H)
  text = text.replace(/(\\ce\{[^\}]+\}|\\text\{[^\}]+\}(?:_[0-9a-zA-Z\{\}]+)?(?:^\^?[0-9a-zA-Z\+\-\{\}]+)?|\\frac\{[^\}]+\}\{[^\}]+\}|\\sqrt\{[^\}]+\})/g, (match) => {
    try {
      const cleanMath = match.replace(/\\ce\{([^\}]+)\}/g, '$1');
      return katex.renderToString(cleanMath, { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });

  // 5. Chemical Formula & Ion Formatting (Subscripts & Superscripts)
  const chemSubMap = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
  };
  const chemSuperMap = {
    '+': '⁺', '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³',
    '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };

  // Convert TeX \text{...} wrappers to clean text
  text = text.replace(/\\text\{([^\}]+)\}/g, '$1');

  // Convert explicit LaTeX subscript / superscript syntax e.g. H_2O -> H₂O, Fe^{3+} -> Fe³⁺
  text = text.replace(/_([0-9])/g, (_, num) => chemSubMap[num] || `_${num}`);
  text = text.replace(/_\{([0-9]+)\}/g, (_, nums) => nums.split('').map(n => chemSubMap[n] || n).join(''));

  // Superscripts with explicit braces e.g. Fe^{3+}, f^{1-14}, d^{0-1}
  text = text.replace(/\^\{([0-9\+\-\=]+)\}/g, (_, syms) => syms.split('').map(s => chemSuperMap[s] || s).join(''));
  // Superscripts without braces e.g. Fe^3+, f^1-14, d^0-1, ns^2, d^10
  text = text.replace(/\^([0-9\+\-\=]+)/g, (_, syms) => syms.split('').map(s => chemSuperMap[s] || s).join(''));

  // Electronic configurations without explicit ^ (e.g. 1s2 2s2 2p6 3d10, f1-14, d0-1, ns2)
  text = text.replace(/\b([nN]?[spdfgSPDFG])([0-9]+(?:[\-\=][0-9]+)?)(?![a-zA-Z0-9])/g, (_, orb, numStr) => {
    const superStr = numStr.split('').map(s => chemSuperMap[s] || s).join('');
    return `${orb}${superStr}`;
  });

  // Ion charges without explicit ^ (e.g. Fe3+, Fe2+, Cu2+, Al3+, O2-, Cl-, Na+, e-)
  text = text.replace(/\b([A-Z][a-z]?|e)\^?([0-9]*[\+\-])(?![a-zA-Z0-9])/g, (_, elem, charge) => {
    const superStr = charge.split('').map(s => chemSuperMap[s] || s).join('');
    return `${elem}${superStr}`;
  });

  // Fix dangling normal digits/hyphens immediately following a superscript character (e.g. f¹-14 -> f¹⁻¹⁴, d⁰-1 -> d⁰⁻¹, d¹0 -> d¹⁰)
  let prevText;
  do {
    prevText = text;
    text = text.replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻])([0-9\+\-\=])/g, (_, sup, sym) => {
      return sup + (chemSuperMap[sym] || sym);
    });
  } while (text !== prevText);

  // Standalone Chemical Formulae Subscripts (e.g. H2O, CO2, H2SO4, C6H12O6, KMnO4)
  text = text.replace(/\b([A-Z][a-z]?)([2-9]|1[0-9]?)(?![0-9\+\-\=⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻])\b/g, (_, elem, num) => {
    const subStr = num.split('').map(n => chemSubMap[n] || n).join('');
    return `${elem}${subStr}`;
  });

  // Subscripts after closing parenthesis e.g. (SO4)3 -> (SO4)₃
  text = text.replace(/\)([2-9]|1[0-9]?)\b/g, (_, num) => {
    const subStr = num.split('').map(n => chemSubMap[n] || n).join('');
    return `)${subStr}`;
  });

  // Common LaTeX Greek letters & scientific symbol replacements for inline text
  const symbolMap = {
    '\\theta': 'θ', '\\Theta': 'Θ',
    '\\omega': 'ω', '\\Omega': 'Ω',
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\Gamma': 'Γ',
    '\\delta': 'δ', '\\Delta': 'Δ',
    '\\degree': '°', '\\deg': '°',
    '\\times': '×', '\\cdot': '·', '\\div': '÷',
    '\\pm': '±', '\\mp': '∓',
    '\\infty': '∞', '\\approx': '≈', '\\neq': '≠',
    '\\leq': '≤', '\\geq': '≥', '\\in': '∈',
    '\\rightarrow': '→', '\\rightleftharpoons': '⇌'
  };

  for (const [latex, unicode] of Object.entries(symbolMap)) {
    const escLatex = latex.replace(/\\/g, '\\\\');
    const regex = new RegExp(`${escLatex}(?![a-zA-Z])`, 'g');
    text = text.replace(regex, unicode);
  }

  // Reaction arrows in Chemistry
  text = text.replace(/<==>|<=>|\\rightleftharpoons/g, '⇌');
  text = text.replace(/-->|->|\\rightarrow/g, '→');

  return text;
}

const { renderQuestionWithStructuredContent } = require('../services/structuredDocumentRenderer');

/**
 * Render a single question item cleanly in compact format with optional figure/diagram image
 */
function renderQuestionItem(q, numStr, showAnswers) {
  return renderQuestionWithStructuredContent(q, numStr, showAnswers, formatScientificText);
}

/**
 * Get question priority order based on question type and marks
 */
function getPatternOrderPriority(q) {
  const type = (q.questionType || q.type || '').toUpperCase();
  const marks = Number(q.marks) || 1;
  const isMcq = (q.options && q.options.length > 0) || type === 'MCQ';

  if (isMcq) return 1;
  if (type === 'VERY_SHORT' || (type === 'SHORT' && marks === 1)) return 2;
  if (type === 'SHORT' && marks === 2) return 3;
  if (type === 'SHORT' && marks === 3) return 4;
  if (type === 'LONG' || marks >= 4) return 5;
  return 99;
}

/**
 * Dynamic Section Body Renderer with 100% question inclusion, center-aligned section titles,
 * and single concise "Attempt any ___ for __ marks each" instructions without duplication.
 */
function buildPatternSections(qp, showAnswers) {
  const patternData = qp.patternData;

  // Extract questions with join order or pattern priority sorting
  let rawQuestions = (qp.questions || []);
  rawQuestions.sort((a, b) => {
    const orderA = a.orderInt !== undefined ? a.orderInt : (getPatternOrderPriority(a.question || a));
    const orderB = b.orderInt !== undefined ? b.orderInt : (getPatternOrderPriority(b.question || b));
    return orderA - orderB;
  });

  let questionsList = rawQuestions.map(q => q.question || q);

  // Guarantee strict pattern sequence: MCQ -> VSA -> Short(2m) -> Short(3m) -> Long(4m)
  questionsList.sort((a, b) => getPatternOrderPriority(a) - getPatternOrderPriority(b));

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
          <p class="section-info"><strong>${instructionText}</strong></p>
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
  const cacheKey = getPdfCacheKey(qp, showAnswers);
  const cached = pdfCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.buffer;
  }

  const browser = await getSharedBrowser();
  const page = await browser.newPage();

  try {
    const examInfo = {
      subject: qp.subject?.name || 'Subject',
      grade: qp.class?.name || qp.grade || 'Class 12th',
      totalMarks: qp.totalMarks,
      durationMins: qp.durationMins,
      difficulty: qp.difficulty,
      date: qp.examDate ? new Date(qp.examDate).toLocaleDateString() : new Date(qp.createdAt || Date.now()).toLocaleDateString(),
      instructions: qp.instructions
    };

    const letterheadHtml = buildLetterhead(examInfo);
    const bodyHtml = buildPatternSections(qp, showAnswers);
    const katexCss = getKatexCss();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${qp.title}</title>
        <style>
          ${katexCss}

          @page {
            size: A4;
            margin: 12mm 15mm 15mm 15mm;
          }
          body {
            font-family: 'Times New Roman', 'Mangal', 'Nirmala UI', 'Kokila', 'Noto Sans Devanagari', Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.35;
            color: #000;
            margin: 0;
            padding: 0;
          }
          .letterhead {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
          }
          .letterhead-center {
            text-align: center;
            flex-grow: 1;
          }
          .school-name {
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
          }
          .school-info {
            font-size: 8.5pt;
            margin: 1px 0;
          }
          .divider {
            border: 0;
            border-top: 1px solid #000;
            margin: 6px 0;
          }
          .exam-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
          }
          .exam-table td {
            padding: 2px 0;
            width: 33%;
          }
          .instructions {
            font-size: 9pt;
            font-style: italic;
            margin: 4px 0;
          }
          .section {
            margin-top: 10px;
          }
          .section-title {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin-top: 10px;
            margin-bottom: 4px;
            page-break-after: avoid;
            break-after: avoid;
          }
          .section-info {
            font-size: 9pt;
            text-align: center;
            margin-bottom: 6px;
            page-break-after: avoid;
            break-after: avoid;
          }
          .subsection-title {
            font-size: 10pt;
            margin-top: 6px;
            margin-bottom: 2px;
            page-break-after: avoid;
            break-after: avoid;
          }
          .subsection-note {
            font-size: 8.5pt;
            margin-bottom: 4px;
          }
          .question {
            margin-bottom: 6px;
            padding: 1px 0;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .question-text {
            margin: 0 0 2px 0;
          }
          .options {
            display: flex;
            flex-wrap: wrap;
            padding-left: 15px;
            margin-top: 2px;
          }
          .option {
            width: 48%;
            font-size: 9.5pt;
            margin-bottom: 2px;
          }
          .answer {
            font-size: 9pt;
            color: #1b5e20;
            background-color: #f1f8e9;
            padding: 3px 6px;
            border-left: 3px solid #4caf50;
            margin-top: 2px;
          }
          .katex-html {
            white-space: normal !important;
          }

          /* Structured Activity Layouts */
          .structured-activity { margin: 6px 0; page-break-inside: avoid; }
          .table-title, .diagram-title, .chart-title, .box-title, .or-title { font-size: 9pt; margin-bottom: 3px; }
          .activity-table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 9.5pt; }
          .activity-table th, .activity-table td { border: 1px solid #333; padding: 4px 8px; text-align: left; }
          .activity-table th { background-color: #f8fafc; font-weight: bold; }

          .tree-container { margin: 6px 0; font-size: 9pt; }
          .tree-root, .tree-children { list-style: none; padding-left: 16px; margin: 2px 0; border-left: 1px dashed #64748b; }
          .tree-node-box { display: inline-block; padding: 2px 8px; border: 1px solid #475569; border-radius: 4px; background: #fafafa; margin: 2px 0; font-weight: bold; }

          .flowchart-container { display: flex; flex-direction: column; align-items: center; margin: 6px 0; }
          .flowchart-node { padding: 4px 12px; border: 1px solid #333; border-radius: 4px; background: #fff; font-size: 9pt; text-align: center; max-width: 85%; }
          .flowchart-decision { border-radius: 8px; background: #fef3c7; font-weight: bold; }
          .flowchart-arrow { font-size: 11pt; margin: 2px 0; color: #333; }
          .flowchart-branches { display: flex; gap: 12px; margin-top: 4px; font-size: 8.5pt; font-style: italic; }

          .mindmap-wrapper { display: flex; flex-direction: column; align-items: center; margin: 6px 0; }
          .mindmap-central { padding: 6px 14px; border: 2px solid #2563eb; border-radius: 20px; background: #eff6ff; font-weight: bold; font-size: 10pt; margin-bottom: 6px; }
          .mindmap-branches-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; width: 100%; }
          .mindmap-branch-box { border: 1px solid #64748b; border-radius: 6px; padding: 4px 8px; background: #f8fafc; font-size: 8.5pt; text-align: center; }
          .mindmap-subitems { margin-top: 2px; }
          .mindmap-subchip { display: inline-block; background: #e2e8f0; border-radius: 10px; padding: 1px 6px; font-size: 7.5pt; margin: 1px; }

          .bar-chart-grid { display: flex; align-items: flex-end; justify-content: space-around; height: 110px; border-left: 2px solid #333; border-bottom: 2px solid #333; padding: 6px 10px; margin: 8px 0; }
          .bar-column { display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
          .bar-fill-wrapper { height: 80px; width: 24px; display: flex; align-items: flex-end; }
          .bar-fill { width: 100%; background-color: #3b82f6; border-radius: 2px 2px 0 0; }
          .bar-value { font-size: 7.5pt; margin-bottom: 1px; }
          .bar-label { font-size: 8pt; margin-top: 2px; }

          .or-block-container { border: 1px dashed #0284c7; padding: 6px 10px; border-radius: 6px; background: #f0f9ff; margin: 6px 0; }
          .or-option-header { color: #0369a1; margin-bottom: 2px; }
          .or-divider { text-align: center; font-weight: bold; font-size: 8.5pt; color: #0284c7; margin: 6px 0; }

          .answer-space-container { margin-top: 4px; margin-bottom: 6px; }
          .word-limit-tag { font-size: 8pt; font-style: italic; color: #475569; display: block; margin-bottom: 2px; }
          .answer-ruled-lines { border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 6px; background: #fafafa; }
          .answer-space-medium .answer-ruled-lines { height: 42px; }
          .answer-space-large .answer-ruled-lines { height: 75px; }
          .ruled-line { border-bottom: 1px dashed #cbd5e1; height: 18px; }
        </style>
      </head>
      <body>
        ${letterheadHtml}
        ${bodyHtml}
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

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
        top: '12mm',
        bottom: '15mm',
        left: '15mm',
        right: '15mm'
      }
    });

    if (pdfCache.size >= MAX_CACHE_SIZE) {
      const firstKey = pdfCache.keys().next().value;
      pdfCache.delete(firstKey);
    }
    pdfCache.set(cacheKey, { buffer: pdfBuffer, timestamp: Date.now() });

    return pdfBuffer;

  } finally {
    await page.close().catch(() => {});
  }
}

module.exports = {
  exportQPToPDF,
  formatScientificText,
  clearPdfCache
};