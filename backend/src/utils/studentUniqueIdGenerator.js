const prisma = require('../config/prisma');

/**
 * Generates a standard institutional Unique ID for a student based on class & stream.
 * Format: {academicYearShort}{classCode}{streamCode}{sequenceNumber} (12 digits)
 * Example: 252611010001
 *   - 2526: Academic Year (e.g. 2025-2026 -> 2526)
 *   - 11: Class (e.g. 11th Standard -> 11, 12th Standard -> 12)
 *   - 01: Stream (01 = Science, 02 = Commerce, 03 = Arts)
 *   - 0001: 4-digit sequential index number for student in that class & stream
 *
 * @param {Object} params
 * @param {string} params.classId - ID of the Class
 * @param {string} [params.streamId] - Optional ID of the Stream
 * @returns {Promise<string>} Generated unique ID string
 */
async function generateStudentUniqueId({ classId, streamId }) {
  let targetClass = null;
  let targetStream = null;

  if (classId) {
    targetClass = await prisma.class.findUnique({
      where: { id: classId },
      include: { stream: true }
    });
  }

  if (streamId) {
    targetStream = await prisma.stream.findUnique({ where: { id: streamId } });
  } else if (targetClass?.stream) {
    targetStream = targetClass.stream;
  }

  // 1. Academic Year Short (e.g., "2025-2026" or "2025-26" -> "2526")
  let academicYearShort = '2526'; // Default fallback
  const ay = targetClass?.academicYear || '2025-2026';

  const yearMatches = ay.match(/\d{2,4}/g);
  if (yearMatches && yearMatches.length >= 2) {
    const startYr = yearMatches[0].slice(-2);
    const endYr = yearMatches[1].slice(-2);
    academicYearShort = `${startYr}${endYr}`;
  } else if (yearMatches && yearMatches.length === 1) {
    const yr = parseInt(yearMatches[0].slice(-2), 10);
    academicYearShort = `${String(yr).padStart(2, '0')}${String(yr + 1).padStart(2, '0')}`;
  }

  // 2. Class Code (11 or 12)
  let classCode = '11';
  const className = (targetClass?.name || '').toLowerCase();
  if (className.includes('12')) {
    classCode = '12';
  } else if (className.includes('11')) {
    classCode = '11';
  }

  // 3. Stream Code (01 = Science, 02 = Commerce, 03 = Arts)
  let streamCode = '01'; // Default to Science
  const streamName = (targetStream?.name || targetClass?.name || '').toLowerCase();
  if (streamName.includes('commerce') || streamName.includes('comm')) {
    streamCode = '02';
  } else if (streamName.includes('arts') || streamName.includes('art')) {
    streamCode = '03';
  } else if (streamName.includes('science') || streamName.includes('sci')) {
    streamCode = '01';
  }

  // 4. Base Prefix
  const prefix = `${academicYearShort}${classCode}${streamCode}`;

  // 5. Calculate Sequential Suffix (0001, 0002...)
  const existingStudents = await prisma.student.findMany({
    where: {
      uniqueId: {
        startsWith: prefix
      }
    },
    select: { uniqueId: true }
  });

  let maxNum = 0;
  for (const s of existingStudents) {
    if (s.uniqueId && s.uniqueId.length >= prefix.length) {
      const suffix = s.uniqueId.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  const sequenceStr = String(nextNum).padStart(4, '0');

  return `${prefix}${sequenceStr}`;
}

module.exports = {
  generateStudentUniqueId
};
