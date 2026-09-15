const nodemailer = require('nodemailer');

// Configure email transporter using environment variables
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Send Task Assignment Email to Student
 */
const sendTaskAssignmentEmail = async ({
  studentEmail,
  studentName,
  taskTitle,
  taskDescription,
  assignedBy = 'Admin',
  topic = 'Engineering Track',
  deadline,
  deliverables = [],
  taskLink,
}) => {
  if (!studentEmail) return;

  const transporter = createTransporter();
  const formattedDeadline = deadline ? new Date(deadline).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : 'No deadline specified';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #F7F5EE; padding: 24px; color: #1C1B1A;">
      <div style="max-width: 600px; margin: 0 auto; background: #FDFCF9; border: 1px solid #E0DDD0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <div style="background: #1C1B1A; color: #ffffff; padding: 20px 24px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">C4GT KIET HUB - New Task Assigned</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #E0DDD0;">Assigned by ${assignedBy}</p>
        </div>

        <div style="padding: 24px; line-height: 1.6;">
          <p style="margin: 0 0 16px 0; font-size: 14px;">Hello <strong>${studentName || 'Student'}</strong>,</p>
          <p style="margin: 0 0 20px 0; font-size: 14px;">You have been assigned a new learning task on the platform.</p>

          <div style="background: #F4F1E8; border: 1px solid #E0DDD0; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1C1B1A;">${taskTitle}</h3>
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #66645E;">${taskDescription || ''}</p>
            
            <div style="font-size: 12px; font-family: monospace; color: #1C1B1A; border-top: 1px solid #E0DDD0; pt-8px; margin-top: 8px;">
              <div><strong>Domain / Subject:</strong> ${topic || 'General'}</div>
              <div><strong>Due Deadline:</strong> ${formattedDeadline}</div>
            </div>
          </div>

          ${Array.isArray(deliverables) && deliverables.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <strong style="font-size: 13px;">Assigned Deliverables / Resources:</strong>
              <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px; color: #4A4843;">
                ${deliverables.map(d => `<li>${typeof d === 'string' ? d : d.name || 'Spec'}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 24px;">
            <a href="${taskLink || 'http://localhost:5173/student'}" 
               style="background: #1C1B1A; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold; display: inline-block;">
              Open Task in Student Workspace &rarr;
            </a>
          </div>
        </div>

        <div style="background: #EEECDF; padding: 12px 24px; text-align: center; font-size: 11px; color: #66645E;">
          C4GT KIET Hub Learning Platform &bull; Automated Task Alert
        </div>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`[EmailService] SMTP credentials not set. Simulated task notification email sent to: ${studentEmail}`);
    return;
  }

  try {
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@c4gt.in';
    await transporter.sendMail({
      from: `"C4GT KIET HUB" <${fromAddress}>`,
      to: studentEmail,
      subject: `New Task Assigned: ${taskTitle}`,
      html: htmlContent,
    });
    console.log(`[EmailService] Task notification email sent successfully to ${studentEmail}`);
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${studentEmail}:`, error.message);
  }
};

module.exports = {
  sendTaskAssignmentEmail,
};
