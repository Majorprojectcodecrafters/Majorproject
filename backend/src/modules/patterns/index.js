/**
 * Patterns Module Barrel Export
 */

const {
  patternsService,
  MAHARASHTRA_BOARD_NAME,
  PATTERN_VERSION,
  BOARD_PATTERNS,
  HINDI_80M_SECTIONS,
  getBoardPatternForSubject,
  getAllBoardPatterns
} = require('./patterns.service');

module.exports = {
  patternsService,
  MAHARASHTRA_BOARD_NAME,
  PATTERN_VERSION,
  BOARD_PATTERNS,
  HINDI_80M_SECTIONS,
  getBoardPatternForSubject,
  getAllBoardPatterns
};
