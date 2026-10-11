import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Format scientific symbols, TeX/LaTeX expressions, chemical compounds, and math using KaTeX
 */
export function formatScientificText(str) {
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
