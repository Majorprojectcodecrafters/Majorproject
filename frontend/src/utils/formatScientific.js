import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Format scientific symbols, TeX/LaTeX expressions, chemical compounds, and math using KaTeX
 */
export function formatScientificText(str) {
  if (!str || typeof str !== 'string') return str || '';

  let text = str;

  // Convert explicit inline math ($...$ or \(...\)) or display math ($$...$$ or \[...\])
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

  // Common LaTeX Greek letters & scientific symbol replacements for inline text
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
    '\\\\degree': '°', '\\\\deg': '°',
    '\\\\times': '×', '\\\\cdot': '·', '\\\\div': '÷',
    '\\\\pm': '±', '\\\\mp': '∓',
    '\\\\infty': '∞', '\\\\approx': '≈', '\\\\neq': '≠',
    '\\\\leq': '≤', '\\\\geq': '≥', '\\\\in': '∈',
    '\\\\rightarrow': '→', '\\\\rightleftharpoons': '⇌'
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
