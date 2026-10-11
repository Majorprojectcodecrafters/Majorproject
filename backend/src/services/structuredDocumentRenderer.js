/**
 * Generic Structured Document & Activity Sheet Renderer
 * Supports: Tables, Tree Diagrams, Flowcharts, Mind Maps, Charts, Boxed Activities,
 * Choice/OR Blocks, Answer Spaces, and Devanagari/Unicode formatting.
 * Reusable across Hindi, Marathi, English, and all academic subjects.
 */

function formatUnicodeText(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/\\r\\n|\\n\\r|\\n|\\r/g, '\n')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Render Table Node
 */
function renderTableNode(data) {
  if (!data || !Array.isArray(data.rows)) return '';
  const headers = data.headers || [];
  const rows = data.rows || [];
  const title = data.title ? `<div class="table-title"><strong>${formatUnicodeText(data.title)}</strong></div>` : '';

  const headerHtml = headers.length
    ? `<thead><tr>${headers.map(h => `<th>${formatUnicodeText(h)}</th>`).join('')}</tr></thead>`
    : '';

  const rowsHtml = rows.map(row => {
    if (!Array.isArray(row)) return '';
    return `<tr>${row.map(cell => `<td>${formatUnicodeText(cell)}</td>`).join('')}</tr>`;
  }).join('');

  return `
    <div class="structured-activity table-activity">
      ${title}
      <table class="activity-table">
        ${headerHtml}
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

/**
 * Render Tree Diagram Node
 */
function renderTreeNode(data) {
  if (!data || !data.root) return '';
  const title = data.title ? `<div class="diagram-title"><strong>${formatUnicodeText(data.title)}</strong></div>` : '';

  function renderBranch(node) {
    if (!node) return '';
    const label = formatUnicodeText(node.label || node.name || '');
    const children = node.children || node.branches || [];

    if (!children.length) {
      return `<li class="tree-leaf"><span class="tree-node-box">${label}</span></li>`;
    }

    return `
      <li class="tree-branch">
        <span class="tree-node-box root-box">${label}</span>
        <ul class="tree-children">
          ${children.map(child => renderBranch(child)).join('')}
        </ul>
      </li>
    `;
  }

  return `
    <div class="structured-activity tree-activity">
      ${title}
      <div class="tree-container">
        <ul class="tree-root">
          ${renderBranch(data.root)}
        </ul>
      </div>
    </div>
  `;
}

/**
 * Render Flowchart Node
 */
function renderFlowchartNode(data) {
  if (!data || !Array.isArray(data.steps)) return '';
  const title = data.title ? `<div class="diagram-title"><strong>${formatUnicodeText(data.title)}</strong></div>` : '';
  const steps = data.steps || [];

  const stepsHtml = steps.map((step, idx) => {
    const isDecision = step.type === 'DECISION' || step.isDecision;
    const shapeClass = isDecision ? 'flowchart-decision' : 'flowchart-process';
    const arrow = idx < steps.length - 1 ? `<div class="flowchart-arrow">↓</div>` : '';

    let optionsHtml = '';
    if (step.options && Array.isArray(step.options)) {
      optionsHtml = `
        <div class="flowchart-branches">
          ${step.options.map(opt => `<div class="flowchart-branch-item">↙ ${formatUnicodeText(opt)}</div>`).join('')}
        </div>
      `;
    }

    return `
      <div class="flowchart-step-wrapper">
        <div class="flowchart-node ${shapeClass}">${formatUnicodeText(step.label || step.text || step)}</div>
        ${optionsHtml}
        ${arrow}
      </div>
    `;
  }).join('');

  return `
    <div class="structured-activity flowchart-activity">
      ${title}
      <div class="flowchart-container">
        ${stepsHtml}
      </div>
    </div>
  `;
}

/**
 * Render Mind Map Node
 */
function renderMindMapNode(data) {
  if (!data || !data.central) return '';
  const centralLabel = formatUnicodeText(data.central);
  const branches = data.branches || data.nodes || [];

  const branchesHtml = branches.map(b => {
    const bLabel = typeof b === 'string' ? b : (b.label || b.name || '');
    const subItems = Array.isArray(b.sub) ? b.sub : [];
    const subHtml = subItems.length
      ? `<div class="mindmap-subitems">${subItems.map(s => `<span class="mindmap-subchip">${formatUnicodeText(s)}</span>`).join('')}</div>`
      : '';

    return `
      <div class="mindmap-branch-box">
        <div class="mindmap-branch-title">${formatUnicodeText(bLabel)}</div>
        ${subHtml}
      </div>
    `;
  }).join('');

  return `
    <div class="structured-activity mindmap-activity">
      <div class="mindmap-wrapper">
        <div class="mindmap-central">${centralLabel}</div>
        <div class="mindmap-branches-grid">
          ${branchesHtml}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Chart Node (SVG Bar/Line Chart)
 */
function renderChartNode(data) {
  if (!data || !Array.isArray(data.data)) return '';
  const title = data.title ? `<div class="chart-title"><strong>${formatUnicodeText(data.title)}</strong></div>` : '';
  const chartType = (data.type || 'BAR').toUpperCase();
  const items = data.data || [];
  const maxVal = Math.max(...items.map(i => Number(i.value || i.val || 0)), 10);

  let chartContentHtml = '';

  if (chartType === 'BAR' || chartType === 'BAR_CHART') {
    const barsHtml = items.map(item => {
      const val = Number(item.value || item.val || 0);
      const heightPct = Math.round((val / maxVal) * 100);
      return `
        <div class="bar-column">
          <div class="bar-value">${val}</div>
          <div class="bar-fill-wrapper">
            <div class="bar-fill" style="height: ${heightPct}%;"></div>
          </div>
          <div class="bar-label">${formatUnicodeText(item.label || item.name || '')}</div>
        </div>
      `;
    }).join('');

    chartContentHtml = `<div class="bar-chart-grid">${barsHtml}</div>`;
  } else {
    // List / Categorical Table Chart Fallback
    chartContentHtml = `
      <table class="activity-table">
        <thead><tr><th>श्रेणी (Category)</th><th>मान (Value)</th></tr></thead>
        <tbody>
          ${items.map(i => `<tr><td>${formatUnicodeText(i.label || i.name)}</td><td>${i.value || i.val}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  return `
    <div class="structured-activity chart-activity">
      ${title}
      ${chartContentHtml}
    </div>
  `;
}

/**
 * Render Box / Grid Activity Node
 */
function renderBoxNode(data) {
  if (!data) return '';
  const title = data.title ? `<div class="box-title"><strong>${formatUnicodeText(data.title)}</strong></div>` : '';
  const content = data.content || data.items || [];

  let bodyHtml = '';
  if (Array.isArray(content)) {
    bodyHtml = `<div class="box-grid">${content.map(c => `<div class="box-grid-cell">${formatUnicodeText(typeof c === 'string' ? c : c.text)}</div>`).join('')}</div>`;
  } else {
    bodyHtml = `<div class="box-text-content">${formatUnicodeText(content)}</div>`;
  }

  return `
    <div class="structured-activity box-activity">
      ${title}
      ${bodyHtml}
    </div>
  `;
}

/**
 * Render OR Block / Choice Node
 */
function renderOrBlockNode(data) {
  if (!data || !Array.isArray(data.options)) return '';
  const title = data.title ? `<div class="or-title"><strong>${formatUnicodeText(data.title)}</strong></div>` : '';
  const options = data.options || [];

  const optionsHtml = options.map((opt, idx) => {
    const optTitle = opt.label || opt.title || `विकल्प ${idx + 1}`;
    const optText = opt.text || opt.content || (typeof opt === 'string' ? opt : '');
    const divider = idx < options.length - 1 ? `<div class="or-divider">─── अथवा (OR) ───</div>` : '';

    return `
      <div class="or-option-card">
        <div class="or-option-header"><strong>${formatUnicodeText(optTitle)}</strong></div>
        <div class="or-option-body">${formatUnicodeText(optText)}</div>
      </div>
      ${divider}
    `;
  }).join('');

  return `
    <div class="structured-activity or-block-activity">
      ${title}
      <div class="or-block-container">
        ${optionsHtml}
      </div>
    </div>
  `;
}

/**
 * Render Answer Space Node (Word Limits & Lines)
 */
function renderAnswerSpaceNode(limitStr) {
  if (!limitStr) return '';
  const isLarge = limitStr.includes('80') || limitStr.includes('100') || limitStr.includes('दीर्घउत्तरी');
  const isMedium = limitStr.includes('40') || limitStr.includes('50') || limitStr.includes('अभिव्यक्ति');

  const spaceClass = isLarge ? 'answer-space-large' : (isMedium ? 'answer-space-medium' : 'answer-space-short');
  const label = limitStr ? `<span class="word-limit-tag">(उत्तर सीमा: ${formatUnicodeText(limitStr)})</span>` : '';

  return `
    <div class="answer-space-container ${spaceClass}">
      ${label}
      <div class="answer-ruled-lines">
        <div class="ruled-line"></div>
        <div class="ruled-line"></div>
        ${isLarge ? `<div class="ruled-line"></div><div class="ruled-line"></div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Render Any Generic Structured Activity Node
 */
function renderStructuredNode(node) {
  if (!node || typeof node !== 'object') return '';
  const type = (node.type || node.nodeType || '').toUpperCase();

  switch (type) {
    case 'TABLE':
      return renderTableNode(node);
    case 'TREE':
    case 'TREE_DIAGRAM':
      return renderTreeNode(node);
    case 'FLOWCHART':
      return renderFlowchartNode(node);
    case 'MIND_MAP':
    case 'MINDMAP':
      return renderMindMapNode(node);
    case 'CHART':
    case 'BAR_CHART':
      return renderChartNode(node);
    case 'BOX':
    case 'GRID':
      return renderBoxNode(node);
    case 'OR_BLOCK':
    case 'CHOICE':
      return renderOrBlockNode(node);
    case 'ANSWER_SPACE':
      return renderAnswerSpaceNode(node.wordLimit || node.limit || node.text);
    default:
      if (node.table) return renderTableNode(node.table);
      if (node.tree) return renderTreeNode(node.tree);
      if (node.flowchart) return renderFlowchartNode(node.flowchart);
      if (node.mindMap) return renderMindMapNode(node.mindMap);
      if (node.chart) return renderChartNode(node.chart);
      if (node.orBlock) return renderOrBlockNode(node.orBlock);
      return '';
  }
}

/**
 * Enhanced Question Renderer handling both plain text questions and structured activity nodes
 */
function renderQuestionWithStructuredContent(q, numStr, showAnswers, formatScientificTextFn) {
  const formatFn = formatScientificTextFn || (t => t);
  const isMcq = (q.options && q.options.length > 0) || q.type === 'MCQ' || q.questionType === 'MCQ';

  const formattedText = formatFn(q.questionText || q.q || q.stem || '');
  const formattedOptions = (q.options || []).map(opt => formatFn(opt));
  const formattedAnswer = formatFn(q.answerKey || q.ans || '');
  const imageUrl = q.imageUrl || q.diagramUrl;

  // Render inline structured nodes if attached to question
  let structuredHtml = '';
  if (q.structuredContent) {
    if (Array.isArray(q.structuredContent)) {
      structuredHtml = q.structuredContent.map(node => renderStructuredNode(node)).join('');
    } else if (typeof q.structuredContent === 'object') {
      structuredHtml = renderStructuredNode(q.structuredContent);
    }
  }

  // Answer space box if word limit is specified
  let answerSpaceHtml = '';
  if (q.responseWordLimit || q.wordLimit) {
    answerSpaceHtml = renderAnswerSpaceNode(q.responseWordLimit || q.wordLimit);
  }

  return `
    <div class="question structured-question">
      <p class="question-text">
        <strong>${numStr}.</strong> ${formattedText}
      </p>
      ${structuredHtml}
      ${imageUrl ? `
        <div class="diagram-container" style="text-align: center; margin: 4px 0;">
          <img src="${imageUrl}" style="max-height: 140px; max-width: 85%; height: auto; border: 1px solid #ccc; padding: 3px; border-radius: 4px;" />
          <div style="font-size: 8pt; font-style: italic; color: #555; margin-top: 1px;">Figure for ${numStr}</div>
        </div>
      ` : ''}
      ${isMcq && formattedOptions.length ? `
        <div class="options">
          ${formattedOptions.map(opt => `<div class="option">${opt}</div>`).join('')}
        </div>
      ` : ''}
      ${answerSpaceHtml}
      ${showAnswers && formattedAnswer
        ? `<p class="answer"><strong>उत्तर / Answer Key:</strong> ${formattedAnswer}</p>`
        : ''
      }
    </div>
  `;
}

/**
 * Non-production Static Renderer Test Fixture (Section 30 requirement)
 * Tests Devanagari Hindi text, Marathi/English text, tables, tree diagrams, flowcharts,
 * mind maps, charts, boxed activities, OR blocks, and answer space boxes.
 */
function getStaticRendererFixture() {
  return {
    title: 'महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळ, पुणे',
    subject: { name: 'Hindi' },
    grade: '12th Standard',
    totalMarks: 80,
    durationMins: 180,
    difficulty: 'MEDIUM',
    instructions: 'सभी प्रश्न अनिवार्य हैं। उत्तर सुंदर एवं सुवाच्य अक्षरों में लिखिए।',
    patternMode: 'BOARD',
    board: 'Maharashtra State Board',
    patternVersion: '2024 Reference Pattern',
    patternData: {
      id: 'MSBSHSE_HSC_HINDI_04',
      subjectName: 'Hindi',
      totalMarks: 80,
      durationMins: 180,
      sections: [
        {
          sectionName: 'विभाग 1 — गद्य (20 अंक)',
          subSections: [
            {
              questionNumber: 'प्र.1 (अ)',
              title: 'पठित गद्यांश आकृति गतिविधि'
            }
          ]
        }
      ]
    },
    questions: [
      {
        questionText: 'निम्नलिखित तालिका को पूर्ण कीजिए (गद्यांश पर आधारित संजाल):',
        questionNumber: 'प्र.1 (अ1)',
        marks: 2,
        type: 'SHORT',
        structuredContent: {
          type: 'TABLE',
          title: 'संजाल / तालिका गतिविधि',
          headers: ['क्रम', 'लेखक का कथन', 'प्रभाव / परिणाम'],
          rows: [
            ['1', 'सत्य और अहिंसा का पालन', 'समाज में शांति एवं सौहार्द की स्थापना'],
            ['2', 'समय का सही नियोजन', 'जीवन में सफलता एवं समृद्धि की प्राप्ति']
          ]
        }
      },
      {
        questionText: 'निम्नलिखित वृक्ष-आरेख (Tree Diagram) द्वारा वर्गीकरण दर्शाइए:',
        questionNumber: 'प्र.1 (अ2)',
        marks: 2,
        type: 'SHORT',
        structuredContent: {
          type: 'TREE_DIAGRAM',
          title: 'हिंदी साहित्य की विधाएँ',
          root: {
            label: 'हिंदी साहित्य',
            children: [
              {
                label: 'गद्य साहित्य',
                children: [{ label: 'कहानी' }, { label: 'निबंध' }, { label: 'नाटक' }]
              },
              {
                label: 'काव्य साहित्य',
                children: [{ label: 'प्रबंध काव्य' }, { label: 'मुक्तक काव्य' }]
              }
            ]
          }
        }
      },
      {
        questionText: 'प्रक्रिया का प्रवाह आरेख (Flowchart) पूरा कीजिए:',
        questionNumber: 'प्र.1 (अ3)',
        marks: 2,
        type: 'SHORT',
        structuredContent: {
          type: 'FLOWCHART',
          title: 'विचार प्रक्रिया प्रवाह',
          steps: [
            { label: 'विषय का चयन' },
            { label: 'सामग्री संकलन' },
            { label: 'संरचना निर्माण', isDecision: true, options: ['सकारात्मक पक्ष', 'नकारात्मक पक्ष'] },
            { label: 'अंतिम आलेखन' }
          ]
        }
      },
      {
        questionText: 'दिए गए विचारों का माइंड मैप (Mind Map) पूर्ण कीजिए:',
        questionNumber: 'प्र.1 (अ4)',
        marks: 2,
        type: 'SHORT',
        structuredContent: {
          type: 'MIND_MAP',
          central: 'पर्यावरण संरक्षण',
          branches: [
            { label: 'वृक्षारोपण', sub: ['नीम', 'बरगद'] },
            { label: 'जल संचयन', sub: ['वर्षा जल', 'पुनर्चक्रण'] },
            { label: 'ऊर्जा बचत', sub: ['सौर ऊर्जा'] }
          ]
        }
      },
      {
        questionText: 'वार्षिक उत्पादन का आरेख (Chart) अध्ययन कीजिए:',
        questionNumber: 'प्र.1 (अ5)',
        marks: 2,
        type: 'SHORT',
        structuredContent: {
          type: 'CHART',
          type: 'BAR',
          title: 'विगत वर्षों में पुस्तक बिक्री वृद्धि',
          data: [
            { label: '2023', val: 40 },
            { label: '2024', val: 65 },
            { label: '2025', val: 85 },
            { label: '2026', val: 100 }
          ]
        }
      },
      {
        questionText: 'व्यावहारिक हिंदी: किसी एक विकल्प का चयन करके उत्तर लिखिए (OR Block):',
        questionNumber: 'प्र.4 (आ)',
        marks: 4,
        type: 'LONG',
        structuredContent: {
          type: 'OR_BLOCK',
          title: 'व्यावहारिक हिंदी विकल्प',
          options: [
            { label: 'विकल्प A', text: 'सूत्र संचालन की प्रमुख विशेषताओं पर प्रकाश डालिए (80-100 शब्द)।' },
            { label: 'विकल्प B', text: 'फिचर लेखन के महत्वपूर्ण चरणों का उल्लेख कीजिए (80-100 शब्द)।' }
          ]
        },
        responseWordLimit: '80-100 words'
      },
      {
        questionText: "'सहानुभूति और संवेदनशीलता' विषय पर अपने विचार 40 से 50 शब्दों में लिखिए:",
        questionNumber: 'प्र.1 (अ6)',
        marks: 2,
        type: 'SHORT',
        responseWordLimit: '40-50 words'
      }
    ]
  };
}

module.exports = {
  renderStructuredNode,
  renderQuestionWithStructuredContent,
  getStaticRendererFixture,
  formatUnicodeText
};
