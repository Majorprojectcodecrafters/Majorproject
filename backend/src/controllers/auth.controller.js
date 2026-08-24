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