/**
 * ============================================================================
 * MODULE: Board Paper Pattern Management Service
 * ============================================================================
 * High-level modular service interface for retrieving, validating, and managing
 * official Maharashtra State Board (MSBSHSE) question paper patterns.
 * 
 * Supports: Physics, Chemistry, Biology (70M), Mathematics & Statistics (80M),
 * English (80M), and Hindi (80M).
 */

const {
  MAHARASHTRA_BOARD_NAME,
  PATTERN_VERSION,
  BOARD_PATTERNS,
  HINDI_80M_SECTIONS,
  getBoardPatternForSubject,
  getAllBoardPatterns
} = require('../../config/boardPatterns');

class PatternsService {
  /**
   * Resolve official board pattern configuration for a subject
   */
  getPatternForSubject(subjectName) {
    return getBoardPatternForSubject(subjectName);
  }

  /**
   * Get all registered board patterns in the system
   */
  getAllPatterns() {
    return getAllBoardPatterns();
  }

  /**
   * Validate that a generated or requested question paper matches its board pattern bounds
   */
  validatePaperPattern(subjectName, paperMarks, paperDurationMins) {
    const pattern = this.getPatternForSubject(subjectName);
    if (!pattern) {
      return { isValid: false, reason: `No pattern found registered for subject: ${subjectName}` };
    }

    if (paperMarks !== pattern.totalMarks) {
      return {
        isValid: false,
        reason: `Total marks mismatch: Expected ${pattern.totalMarks} marks for ${pattern.subjectName}, got ${paperMarks}`
      };
    }

    if (paperDurationMins !== pattern.durationMins) {
      return {
        isValid: false,
        reason: `Duration mismatch: Expected ${pattern.durationMins} mins for ${pattern.subjectName}, got ${paperDurationMins}`
      };
    }

    return { isValid: true, pattern };
  }
}

module.exports = {
  patternsService: new PatternsService(),
  MAHARASHTRA_BOARD_NAME,
  PATTERN_VERSION,
  BOARD_PATTERNS,
  HINDI_80M_SECTIONS,
  getBoardPatternForSubject,
  getAllBoardPatterns
};
