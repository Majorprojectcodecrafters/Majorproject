const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');



// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, dob } = req.body;

    // Validate role
    if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        dob: new Date(dob),

        // Auto-create role profile
        ...(role === 'TEACHER' && {
          teacher: {
            create: {
              education: req.body.education || '',
              experienceYears: req.body.experienceYears || 0
            }
          }
        }),

        ...(role === 'STUDENT' && {
          student: {
            create: {
              uniqueId: req.body.uniqueId,
              contact: req.body.contact,
              classId: req.body.classId,
              streamId: req.body.streamId
            }
          }
        })
      },
      include: {
        teacher: true,
        student: true
      }
    });

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    res.status(201).json({ success: true, data: { user: safeUser, token } });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        teacher: true,
        student: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    res.json({ success: true, data: { user: safeUser, token } });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET ME
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        teacher: true,
        student: {
          include: {
            class: true,
            stream: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};