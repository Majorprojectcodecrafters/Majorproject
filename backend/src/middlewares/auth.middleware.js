const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB with role profile
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        teacher: true,
        student: {
          include: {
            stream: true
          }
        }
    }
  });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    // Attach full user + role-specific profile id
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      teacherId: user.teacher?.id || null,
      studentId: user.student?.id || null
    };

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    return res.status(500).json({ success: false, message: 'Auth error', error: error.message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };