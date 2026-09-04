/**
 * Email HTML templates for transactional notifications.
 * Responsive, clean inline CSS suitable for major email clients.
 */

function baseLayout({ title, preheader, content }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #f8fafc; }
    .container { max-width: 580px; margin: 30px auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
    .header { background: linear-gradient(135deg, #e11d48, #be123c); padding: 28px 24px; text-align: center; }
    .brand { font-size: 24px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; margin: 0; }
    .subtitle { color: #fecdd3; font-size: 13px; margin-top: 4px; }
    .content { padding: 32px 28px; line-height: 1.6; color: #cbd5e1; }
    .highlight-box { background: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 20px; margin: 24px 0; text-align: center; }
    .highlight-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .highlight-value { font-size: 22px; font-weight: 700; color: #38bdf8; letter-spacing: 1px; font-family: monospace; word-break: break-all; }
    .btn { display: inline-block; background-color: #e11d48; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; text-align: center; }
    .footer { border-top: 1px solid #334155; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; background: #0f172a; }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none;font-size:1px;color:#0f172a;max-height:0;">${preheader}</span>` : ''}
  <div class="container">
    <div class="header">
      <h1 class="brand">IRONLINE</h1>
      <div class="subtitle">Gym Management Platform</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      This is an automated message from Ironline Gym Management System.<br>
      Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>`;
}

function passwordResetEmail(gymName, tempPassword) {
  const content = `
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Temporary Password Issued</h2>
    <p>A temporary access password has been generated for your gym account at <strong>${gymName || 'Ironline Gym'}</strong>.</p>
    
    <div class="highlight-box">
      <div class="highlight-label">Temporary Password</div>
      <div class="highlight-value">${tempPassword}</div>
    </div>

    <p style="color: #fca5a5; font-size: 13px;">
      <strong>Important:</strong> Please log in promptly and change this password under your account settings.
    </p>
  `;

  return baseLayout({
    title: `Temporary Password - ${gymName || 'Ironline Gym'}`,
    preheader: 'Your temporary access credentials for Ironline Gym',
    content,
  });
}

function welcomeEmail(customerName, gymName, username) {
  const content = `
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Welcome to the Gym!</h2>
    <p>Hi <strong>${customerName || 'Member'}</strong>,</p>
    <p>Welcome to <strong>${gymName || 'Ironline Gym'}</strong>! Your member portal account is active.</p>
    
    <div class="highlight-box">
      <div class="highlight-label">Your Username</div>
      <div class="highlight-value">${username}</div>
    </div>

    <p>Use your member portal to track workouts, check diet goals, view your fee invoices, and track your attendance streaks.</p>
  `;

  return baseLayout({
    title: `Welcome to ${gymName || 'Ironline'}`,
    preheader: `Welcome to ${gymName || 'Ironline Gym'}! Your member account is ready.`,
    content,
  });
}

function overdueReminderEmail(customerName, amount, dueDate, gymName) {
  const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Due date passed';
  const content = `
    <h2 style="color: #f87171; margin-top: 0; font-size: 20px;">Membership Fee Overdue Notice</h2>
    <p>Hello <strong>${customerName || 'Member'}</strong>,</p>
    <p>This is a reminder that your membership fee for <strong>${gymName || 'your gym'}</strong> is past due.</p>
    
    <div class="highlight-box" style="border-color: #7f1d1d;">
      <div class="highlight-label">Amount Overdue</div>
      <div class="highlight-value" style="color: #f87171;">$${Number(amount || 0).toFixed(2)}</div>
      <div style="font-size: 13px; color: #94a3b8; margin-top: 6px;">Due Date: ${formattedDate}</div>
    </div>

    <p>Please clear this pending balance with gym administration to maintain uninterrupted access to facilities and services.</p>
  `;

  return baseLayout({
    title: 'Membership Fee Overdue Notice',
    preheader: `Notice: You have an overdue fee of $${Number(amount || 0).toFixed(2)}`,
    content,
  });
}

function announcementEmail(gymName, title, message) {
  const content = `
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">${title || 'Gym Announcement'}</h2>
    <p style="color: #94a3b8; font-size: 14px;">From: <strong>${gymName || 'Ironline Gym'}</strong></p>
    <div style="background: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 20px; margin: 20px 0;">
      ${message ? message.replace(/\n/g, '<br>') : ''}
    </div>
  `;

  return baseLayout({
    title: title || 'Gym Announcement',
    preheader: message ? message.slice(0, 100) : 'Announcement from gym administration',
    content,
  });
}

function paymentReceiptEmail(customerName, amount, receiptNumber, gymName) {
  const content = `
    <h2 style="color: #4ade80; margin-top: 0; font-size: 20px;">Payment Confirmation & Receipt</h2>
    <p>Hi <strong>${customerName || 'Member'}</strong>,</p>
    <p>Thank you for your payment to <strong>${gymName || 'Ironline Gym'}</strong>. Your membership fee has been received.</p>
    
    <div class="highlight-box" style="border-color: #166534;">
      <div class="highlight-label">Amount Paid</div>
      <div class="highlight-value" style="color: #4ade80;">$${Number(amount || 0).toFixed(2)}</div>
      <div style="font-size: 13px; color: #94a3b8; margin-top: 6px;">Receipt #: <strong>${receiptNumber}</strong></div>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${new Date().toLocaleDateString()}</div>
    </div>

    <p>Your membership is in good standing. Keep crushing your fitness goals!</p>
  `;

  return baseLayout({
    title: `Payment Receipt - ${receiptNumber}`,
    preheader: `Thank you! Your payment of $${Number(amount || 0).toFixed(2)} was received.`,
    content,
  });
}

module.exports = {
  passwordResetEmail,
  welcomeEmail,
  overdueReminderEmail,
  announcementEmail,
  paymentReceiptEmail,
};
