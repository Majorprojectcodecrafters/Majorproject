/**
 * Format scientific symbols, Greek letters, and LaTeX math expressions for React rendering
 */
export function formatScientificText(str) {
  if (!str || typeof str !== 'string') return str || '';

  let text = str;

  const symbolMap = {
    '\\theta': 'θ', '\\Theta': 'Θ',
    '\\omega': 'ω', '\\Omega': 'Ω',
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\Gamma': 'Γ',
    '\\delta': 'δ', '\\Delta': 'Δ',
    '\\epsilon': 'ε', '\\varepsilon': 'ε',
    '\\lambda': 'λ', '\\Lambda': 'Λ',
    '\\mu': 'μ', '\\nu': 'ν',
    '\\pi': 'π', '\\Pi': 'Π',
    '\\rho': 'ρ', '\\sigma': 'σ', '\\Sigma': 'Σ',
    '\\tau': 'τ', '\\phi': 'ϕ', '\\varphi': 'ϕ', '\\Phi': 'Φ',
    '\\psi': 'ψ', '\\Psi': 'Ψ',
    '\\degree': '°', '\\deg': '°',
    '\\times': '×', '\\cdot': '·', '\\div': '÷',
    '\\pm': '±', '\\mp': '∓',
    '\\infty': '∞', '\\approx': '≈', '\\neq': '≠',
    '\\leq': '≤', '\\geq': '≥', '\\in': '∈', '\\rightarrow': '→'
  };

  for (const [latex, unicode] of Object.entries(symbolMap)) {
    const escLatex = latex.replace(/\\/g, '\\\\');
    const regex = new RegExp(`${escLatex}(?![a-zA-Z])`, 'g');
    text = text.replace(regex, unicode);
  }

  // Handle degree notations like ^\circ or ^{\circ}
  text = text.replace(/\^\{\\circ\}|\^\\circ/g, '°');

  // Handle square roots: \sqrt{...}
  text = text.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

  // Handle fractions: \frac{a}{b}
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)');

  // Strip single inline math dollar signs ($ ... $)
  text = text.replace(/\$([^$]+)\$/g, '$1');

  return text;
}
