/**
 * ============================================================================
 * MODULE: Syllabus & Streamwise Curriculum Management Service
 * ============================================================================
 * High-level modular service interface for managing stream-wise (Science, Commerce, Arts)
 * subjects, academic class levels (11th, 12th), units, chapters, topics, page ranges,
 * and chapter weightage rules across the board.
 */

const prisma = require('../../config/prisma');
const syllabusMapperService = require('../../services/syllabusMapperService');

class SyllabusService {
  /**
   * Fetch all subjects registered under a specific stream and class
   */
  async getSubjectsByStreamAndClass(streamName, className) {
    const stream = await prisma.stream.findFirst({
      where: { name: { equals: streamName, mode: 'insensitive' } }
    });
    if (!stream) return [];

    const subjects = await prisma.subject.findMany({
      where: { streamId: stream.id },
      include: {
        classSubjects: {
          include: {
            class: true
          }
        },
        units: {
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { chapterNo: 'asc' },
              include: { topics: true }
            }
          }
        }
      }
    });

    if (!className) return subjects;

    return subjects.filter((s) =>
      s.classSubjects.some((cs) => cs.class.name.toLowerCase().includes(className.toLowerCase()))
    );
  }

  /**
   * Fetch chapter hierarchy and topics for a subject
   */
  async getSubjectCurriculum(subjectId) {
    return await prisma.chapter.findMany({
      where: { subjectId },
      orderBy: { chapterNo: 'asc' },
      include: {
        unit: true,
        topics: true,
        weightages: true
      }
    });
  }

  /**
   * Map textbook page range for a given chapter
   */
  async getChapterPageBounds(subjectId, chapterId) {
    if (syllabusMapperService && typeof syllabusMapperService.getPageBounds === 'function') {
      return await syllabusMapperService.getPageBounds(subjectId, chapterId);
    }
    return await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, chapterNo: true, name: true, pageStart: true, pageEnd: true }
    });
  }

  /**
   * Fetch chapter weightages for paper blueprint selection
   */
  async getChapterWeightages(subjectId, classId) {
    return await prisma.chapterWeightage.findMany({
      where: { subjectId, classId }
    });
  }
}

module.exports = {
  syllabusService: new SyllabusService(),
  syllabusMapperService
};
