const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  if (!host && !user) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

/**
 * Sends an email using Nodemailer.
 * Degrades gracefully if SMTP credentials are not configured in environment.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plaintext fallback content
 * @returns {Promise<{success?: boolean, skipped?: boolean, error?: string, messageId?: string}>}
 */
async function sendEmail({ to, subject, html, text }, retries = 3) {
  if (!to) {
    return { skipped: true, error: 'No recipient specified' };
  }

  const mailClient = getTransporter();
  if (!mailClient) {
    console.warn(`[mailer] SMTP not configured. Skipped sending email to <${to}>: "${subject}"`);
    return { skipped: true };
  }

  const fromName = process.env.FROM_NAME || 'Ironline Gym';
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@ironlinegym.com';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await mailClient.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
        text: text || (html ? html.replace(/<[^>]*>?/gm, '') : ''),
      });
      console.log(`[mailer] Email sent successfully to <${to}> (ID: ${info.messageId}) [attempt ${attempt}]`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.warn(`[mailer] Attempt ${attempt}/${retries} failed for <${to}>:`, err.message);
      if (attempt === retries) {
        console.error(`[mailer] All ${retries} attempts failed for <${to}>`);
        return { success: false, error: err.message };
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

module.exports = {
  sendEmail,
  getTransporter,
};
