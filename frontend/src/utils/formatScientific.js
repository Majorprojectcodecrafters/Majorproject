import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Format scientific symbols, TeX/LaTeX expressions, chemical compounds, and math using KaTeX
 */
export function formatScientificText(str) {
  if (!str || typeof str !== 'string') return str || '';

  let text = str;

  // Reaction arrows in Chemistry
  text = text.replace(/<==>|<=>|\\rightleftharpoons/g, '\\rightleftharpoons ');
  text = text.replace(/-->|->|\\rightarrow/g, '\\rightarrow ');

  // Convert explicit inline math ($...$ or \(...\)) or display math ($$...$$ or \[...\])
  const renderMathInText = (input) => {
    return input.replace(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$|\\\(.+?\\\)|\\\[.+?\\\])/g, (match) => {
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
  };

  if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
    return renderMathInText(text);
  }

  // Auto-detect un-delimited TeX expressions (e.g. \frac{a}{b}, \sqrt{x}, \int_0^1, \theta, H_2SO_4)
  if (/\\(frac|sqrt|int|sum|prod|alpha|beta|gamma|delta|theta|omega|pi|lambda|mu|sigma|rightarrow|rightleftharpoons)|[\^_]\{/i.test(text)) {
    try {
      return katex.renderToString(text, { displayMode: false, throwOnError: false });
    } catch (e) {
      return text;
    }
  }

  return text;
}
