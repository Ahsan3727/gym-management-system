const Fee = require('../models/Fee');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/mailer');
const { overdueReminderEmail } = require('../utils/emailTemplates');

/**
 * Scans for unpaid fees whose due date has passed, flips their status
 * to 'overdue', and notifies affected customers via in-app notification
 * and email (if configured).
 *
 * @returns {Promise<{ scanned: number, updated: number, notified: number, emailsSent: number }>}
 */
async function markOverdueFees() {
  const now = new Date();

  // Find all unpaid fees whose due date is before right now
  const overdueFees = await Fee.find({
    status: 'unpaid',
    dueDate: { $lt: now },
  }).populate([
    {
      path: 'customer',
      populate: { path: 'user', select: 'username email isActive' },
    },
    {
      path: 'admin',
      select: 'gymName contactEmail',
    },
  ]);

  let updatedCount = 0;
  let notificationCount = 0;
  let emailCount = 0;

  for (const fee of overdueFees) {
    // 1. Update fee status to 'overdue'
    fee.status = 'overdue';
    await fee.save();
    updatedCount++;

    const customer = fee.customer;
    const admin = fee.admin;
    const user = customer?.user;

    if (user?._id) {
      // 2. In-app notification
      try {
        await Notification.create({
          user: user._id,
          type: 'fee_due',
          message: `Your membership fee of $${fee.amount.toFixed(2)} was due on ${fee.dueDate.toISOString().split('T')[0]} and is now overdue. Please clear this with gym administration.`,
        });
        notificationCount++;
      } catch (notifyErr) {
        console.error(`[overdue-cron] Failed to create notification for user ${user._id}:`, notifyErr.message);
      }

      // 3. Email reminder
      const recipientEmail = user.email || (user.username?.includes('@') ? user.username : null);
      if (recipientEmail) {
        try {
          const mailRes = await sendEmail({
            to: recipientEmail,
            subject: `Overdue Membership Fee Reminder — ${admin?.gymName || 'Ironline Gym'}`,
            html: overdueReminderEmail(customer.name, fee.amount, fee.dueDate, admin?.gymName),
          });
          if (mailRes.success) emailCount++;
        } catch (mailErr) {
          console.error(`[overdue-cron] Failed to email overdue notice to ${recipientEmail}:`, mailErr.message);
        }
      }
    }
  }

  const result = {
    scanned: overdueFees.length,
    updated: updatedCount,
    notified: notificationCount,
    emailsSent: emailCount,
  };

  console.log('[overdue-cron] Run summary:', result);
  return result;
}

module.exports = markOverdueFees;
