const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');



const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

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

    // Pre-resolve student class/stream if student role
    let studentClassId = req.body.classId;
    let studentStreamId = req.body.streamId;

    if (role === 'STUDENT') {
      if (!studentClassId) {
        return res.status(400).json({ success: false, message: 'Class selection is required for student registration' });
      }
      const targetClass = await prisma.class.findUnique({ where: { id: studentClassId } });
      if (!targetClass) {
        return res.status(400).json({ success: false, message: 'Selected class does not exist' });
      }
      if (!studentStreamId && targetClass.streamId) {
        studentStreamId = targetClass.streamId;
      }
      if (!studentStreamId) {
        const firstStream = await prisma.stream.findFirst();
        studentStreamId = firstStream ? firstStream.id : null;
      }
      if (!studentStreamId) {
        return res.status(400).json({ success: false, message: 'No valid stream found for class allocation' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        dob: new Date(dob || '2005-01-01'),

        // Auto-create role profile
        ...(role === 'TEACHER' && {
          teacher: {
            create: {
              education: req.body.education || 'N/A',
              experienceYears: Number(req.body.experienceYears || 0)
            }
          }
        }),

        ...(role === 'STUDENT' && {
          student: {
            create: {
              uniqueId: req.body.uniqueId || `STU-${Math.floor(100000 + Math.random() * 900000)}`,
              contact: req.body.contact || 'N/A',
              classId: studentClassId,
              streamId: studentStreamId
            }
          }
        })
      },
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

    const token = generateToken(user);
    const { password: _, resetOtp: __, resetOtpExpires: ___, resetOtpAttempts: ____, ...safeUser } = user;

    // Set HttpOnly cookie
    res.cookie('token', token, COOKIE_OPTIONS);

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
    const { password: _, resetOtp: __, resetOtpExpires: ___, resetOtpAttempts: ____, ...safeUser } = user;

    // Set HttpOnly cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({ success: true, data: { user: safeUser, token } });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.json({ success: true, message: 'Logged out successfully' });
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

    const { password: _, resetOtp: __, resetOtpExpires: ___, resetOtpAttempts: ____, ...safeUser } = user;
    res.json({ success: true, data: safeUser });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== GOOGLE DRIVE OAUTH 2.0 FLOW ====================
const { google } = require('googleapis');

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured in .env');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// GET /api/auth/google/url — Get Google Drive OAuth authorization URL
exports.getGoogleAuthUrl = async (req, res) => {
  try {
    const oAuth2Client = getOAuth2Client();
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive']
    });

    if (req.query.redirect === 'true') {
      return res.redirect(authUrl);
    }

    res.json({
      success: true,
      authUrl,
      instructions: 'Open authUrl in browser, grant permissions, and copy the refresh_token from the callback page.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/auth/google/callback — OAuth 2.0 Redirect Callback Handler
exports.googleOAuthCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('<h3>❌ Authorization code missing in request.</h3>');
    }

    const oAuth2Client = getOAuth2Client();
    const { tokens } = await oAuth2Client.getToken(code);

    const refreshToken = tokens.refresh_token;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QPGen - Google Drive OAuth Success</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
          .card { max-width: 650px; margin: 0 auto; background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          h1 { color: #16a34a; font-size: 24px; margin-top: 0; }
          code { background: #f1f5f9; padding: 12px; display: block; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 14px; border: 1px solid #cbd5e1; }
          .alert { background: #e0f2fe; color: #0369a1; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ Google Drive OAuth Authorization Successful!</h1>
          <p>Copy your <strong>Refresh Token</strong> below and paste it into your <code>backend/.env</code> file:</p>
          <div class="alert"><strong>GOOGLE_REFRESH_TOKEN=</strong></div>
          <code>${refreshToken || tokens.access_token}</code>
          <p style="margin-top: 24px; color: #64748b; font-size: 13px;">You can close this browser tab now.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`<h3>❌ Google Drive OAuth Token Exchange Failed:</h3><p>${error.message}</p>`);
  }
};

// PUBLIC CLASSES & STREAMS FOR REGISTRATION
exports.getPublicClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPublicStreams = async (req, res) => {
  try {
    const streams = await prisma.stream.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: streams });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== FORGOT PASSWORD OTP FLOW ====================

const { sendPasswordResetOtpEmail } = require('../utils/emailService');

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email address is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this email address' });
    }

    // Generate 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes lifetime

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otpCode,
        resetOtpExpires: expiresAt,
        resetOtpAttempts: 0
      }
    });

    // Send system OTP email
    await sendPasswordResetOtpEmail(user.email, user.name, otpCode);

    res.json({
      success: true,
      message: `A 6-digit OTP code has been sent to your email (${user.email}). It expires in 10 minutes.`
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ success: false, message: 'No OTP reset request found for this account. Please request a new OTP.' });
    }

    if (new Date() > new Date(user.resetOtpExpires)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP code.' });
    }

    if (user.resetOtpAttempts >= 3) {
      return res.status(400).json({ success: false, message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.' });
    }

    if (user.resetOtp !== otp.toString().trim()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtpAttempts: user.resetOtpAttempts + 1 }
      });
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check your email and try again.' });
    }

    res.json({ success: true, message: 'OTP code verified successfully! You may now set your new password.' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.resetOtp || user.resetOtp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP token' });
    }

    if (new Date() > new Date(user.resetOtpExpires)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    // Hash new password and clear OTP fields
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpires: null,
        resetOtpAttempts: 0
      }
    });

    res.json({ success: true, message: 'Password reset successfully! You can now sign in with your new password.' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};