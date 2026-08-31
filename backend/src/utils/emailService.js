const nodemailer = require('nodemailer');

/**
 * Creates a Nodemailer transporter instance based on environment configuration
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return null;
}

/**
 * Sends a system-generated 6-digit OTP email to the user for Password Reset with high deliverability & zero spam flags
 */
async function sendPasswordResetOtpEmail(userEmail, userName, otpCode) {
  const transporter = createTransporter();
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@ssmm.ac.in';
  const institutionName = process.env.SCHOOL_NAME || 'Shri Siddheshwar Mahavidyalaya';
  
  const fromAddress = process.env.SMTP_FROM || `"${institutionName} - QPGen Portal" <${smtpUser}>`;
  const subject = `Your QPGen Verification Code: ${otpCode}`;

  // Plain-text alternative (Essential for passing Gmail & SpamFilter deliverability checks)
  const textContent = `Hello ${userName || 'User'},\n\nYour verification code for the QPGen Academic Portal is: ${otpCode}\n\nThis single-use code is valid for 10 minutes to process your password reset request.\n\nIf you did not request this verification code, please disregard this message.\n\nBest regards,\nQPGen Academic Portal\n${institutionName}`;

  // HTML email body optimized for inbox primary tab placement
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>QPGen Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 24px 12px; }
        .email-container { max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .email-header { background-color: #0f172a; padding: 24px; text-align: center; }
        .email-header h1 { color: #3b82f6; font-size: 22px; margin: 0; font-weight: 800; tracking-spacing: -0.5px; }
        .email-header p { color: #94a3b8; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; }
        .email-body { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
        .instructions { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .code-container { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
        .code-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
        .code-display { font-family: "Courier New", Courier, monospace; font-size: 34px; font-weight: 800; color: #1d4ed8; letter-spacing: 10px; margin: 0; }
        .validity-note { font-size: 12px; color: #64748b; text-align: center; margin-top: 12px; }
        .security-notice { border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; font-size: 12px; line-height: 1.5; color: #94a3b8; }
        .email-footer { background-color: #f8fafc; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>QPGen</h1>
          <p>${institutionName}</p>
        </div>
        <div class="email-body">
          <div class="greeting">Hello ${userName || 'User'},</div>
          <div class="instructions">
            You recently submitted a request to reset your password for your <strong>QPGen Academic Portal</strong> account. Please use the verification code below:
          </div>
          
          <div class="code-container">
            <div class="code-label">Verification Code</div>
            <div class="code-display">${otpCode}</div>
            <div class="validity-note">This single-use code is valid for <strong>10 minutes</strong>.</div>
          </div>

          <div class="security-notice">
            If you did not request a password reset, you can safely disregard this email. Your account credentials remain secure.
          </div>
        </div>
        <div class="email-footer">
          &copy; ${new Date().getFullYear()} ${institutionName}. All rights reserved.<br>
          Official Academic Examination & Question Paper Generation Portal
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: fromAddress,
    to: userEmail,
    subject: subject,
    text: textContent,
    html: htmlContent,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Auto-Response-Suppress': 'OOF, AutoReply'
    }
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Clean OTP Email dispatched to inbox for ${userEmail}:`, info.messageId);
      return { success: true, messageId: info.messageId, mode: 'SMTP' };
    } catch (err) {
      console.error(`❌ SMTP Delivery Exception for ${userEmail}:`, err.message);
      return { success: false, mode: 'SMTP_FAILED', error: err.message };
    }
  } else {
    console.log(`ℹ️ SMTP Not Configured. Simulated OTP for ${userEmail}: [ ${otpCode} ]`);
    return { success: true, mode: 'SIMULATED' };
  }
}

module.exports = {
  sendPasswordResetOtpEmail
};
