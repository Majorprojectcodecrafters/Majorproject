const prisma = require('../config/prisma');
const { uploadAttachmentFile } = require('../utils/googleDriveService');

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, classId } = req.body;
    const user = req.user;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    // Permission check for Teachers: must target assigned classes only
    if (user.role === 'TEACHER') {
      if (!classId) {
        return res.status(403).json({ success: false, message: 'Teachers must specify a target assigned class' });
      }

      const teacherAssignments = await prisma.teacherAssignment.findMany({
        where: { teacherId: user.teacherId },
        select: { classId: true }
      });
      const assignedClassIds = teacherAssignments.map(a => a.classId);

      if (!assignedClassIds.includes(classId)) {
        return res.status(403).json({ success: false, message: 'You can only post announcements to your assigned classes' });
      }
    }

    // Handle File Attachment Upload
    let attachmentUrl = null;
    let attachmentType = 'NONE';
    let driveFileId = null;

    if (req.file) {
      const mime = req.file.mimetype || '';
      if (mime.includes('image')) attachmentType = 'IMAGE';
      else if (mime.includes('pdf')) attachmentType = 'PDF';
      else attachmentType = 'DOCUMENT';

      const uploadResult = await uploadAttachmentFile(req.file);
      if (uploadResult) {
        attachmentUrl = uploadResult.url;
        driveFileId = uploadResult.driveFileId;
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        attachmentUrl,
        attachmentType,
        driveFileId,
        authorRole: user.role,
        authorName: user.name,
        authorId: user.id,
        classId: classId || null
      },
      include: { class: true }
    });

    res.status(201).json({ success: true, message: 'Announcement created successfully!', data: announcement });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const user = req.user;
    let whereCondition = {};

    if (user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { id: user.studentId } });
      whereCondition = {
        OR: [
          { classId: student?.classId },
          { classId: null } // Broadcast to all
        ]
      };
    } else if (user.role === 'TEACHER') {
      const teacherAssignments = await prisma.teacherAssignment.findMany({
        where: { teacherId: user.teacherId },
        select: { classId: true }
      });
      const assignedClassIds = teacherAssignments.map(a => a.classId);
      whereCondition = {
        OR: [
          { classId: { in: assignedClassIds } },
          { authorId: user.id },
          { classId: null }
        ]
      };
    }

    const announcements = await prisma.announcement.findMany({
      where: whereCondition,
      include: { class: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: announcements });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Announcement not found' });

    if (user.role === 'TEACHER' && existing.authorId !== user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete announcements created by you' });
    }

    await prisma.announcement.delete({ where: { id } });

    res.json({ success: true, message: 'Announcement deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
