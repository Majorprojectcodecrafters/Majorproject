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
      auth: { user, pass }
    });
  }

  return null;
}

/**
 * Sends a system-generated 6-digit OTP email to the user for Password Reset
 */
async function sendPasswordResetOtpEmail(userEmail, userName, otpCode) {
  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || `"QPGen Academic System" <${process.env.SMTP_USER || 'no-reply@qpgen.edu'}>`;

  const mailOptions = {
    from: fromAddress,
    to: userEmail,
    subject: '🔑 Your QPGen Password Reset OTP Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
          .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
          .header { text-align: center; border-b: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 26px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
          .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 12px; }
          .otp-box { background: #f1f5f9; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; font-family: monospace; }
          .warning { background: #fef3c7; color: #92400e; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 28px; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">QPGen</div>
            <div class="title">Password Reset Request</div>
          </div>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>We received a request to reset your QPGen account password. Use the 6-digit OTP code below to verify your identity:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
          </div>

          <p style="font-size: 13px; color: #475569;">This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>

          <div class="warning">
            ⚠️ If you did not request a password reset, please ignore this email or contact your administrator immediately.
          </div>

          <div class="footer">
            &copy; ${new Date().getFullYear()} QPGen Academic Portal. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ System OTP Email sent successfully to ${userEmail}:`, info.messageId);
      return { success: true, messageId: info.messageId, mode: 'SMTP' };
    } catch (err) {
      console.error(`❌ Failed to send SMTP email to ${userEmail}:`, err.message);
      // Fallback logging
      console.log(`\n========================================`);
      console.log(`🔑 FORGOT PASSWORD OTP FOR ${userEmail}: [ ${otpCode} ]`);
      console.log(`========================================\n`);
      return { success: true, mode: 'FALLBACK_LOG', error: err.message };
    }
  } else {
    console.log(`\n========================================`);
    console.log(`ℹ️ SMTP Not Configured. Simulated OTP for ${userEmail}: [ ${otpCode} ]`);
    console.log(`========================================\n`);
    return { success: true, mode: 'SIMULATED' };
  }
}

module.exports = {
  sendPasswordResetOtpEmail
};
