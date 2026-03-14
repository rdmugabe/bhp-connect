import { Resend } from 'resend';

// Lazy-initialize Resend to avoid build-time errors when API key is not set
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is missing. Available env vars:', Object.keys(process.env).filter(k => k.includes('RESEND') || k.includes('NEXT')));
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

interface EnrollmentEmailParams {
  to: string[];
  residentName: string;
  facilityName: string;
  admissionDate: string | null;
  bhpName: string;
  bhpEmail: string;
}

export async function sendEnrollmentEmail({
  to,
  residentName,
  facilityName,
  admissionDate,
  bhpName,
  bhpEmail,
}: EnrollmentEmailParams) {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Resident Enrollment Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 24px;">New Resident Enrollment Notification</h1>
    <p style="color: #666; margin: 0; font-size: 14px;">A new resident has been enrolled at one of your facilities.</p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #666; width: 140px;">Resident:</td>
        <td style="padding: 8px 0; font-weight: 500;">${residentName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Facility:</td>
        <td style="padding: 8px 0; font-weight: 500;">${facilityName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Admission Date:</td>
        <td style="padding: 8px 0; font-weight: 500;">${admissionDate || 'Not specified'}</td>
      </tr>
    </table>
  </div>

  <div style="text-align: center; margin: 30px 0; padding: 16px; background-color: #e0f2fe; border-radius: 6px;">
    <p style="margin: 0; color: #0369a1; font-size: 14px; font-weight: 500;">Please log in to BHP Connect to view full resident details and intake information.</p>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
    <p style="margin: 0 0 8px 0;">This email was sent from <strong>BHP Connect</strong></p>
    <p style="margin: 0;">Sent on behalf of ${bhpName}</p>
  </div>
</body>
</html>
  `.trim();

  return getResendClient().emails.send({
    from: `${facilityName} via BHP Connect <notifications@bhpconnekt.com>`,
    replyTo: bhpEmail,
    to,
    subject: `New Resident Enrollment: ${residentName}`,
    html: emailHtml,
  });
}

interface EmployeeEmailParams {
  to: string[];
  employeeName: string;
  position: string;
  facilityName: string;
  hireDate: string | null;
  bhpName: string;
  bhpEmail: string;
}

export async function sendEmployeeEmail({
  to,
  employeeName,
  position,
  facilityName,
  hireDate,
  bhpName,
  bhpEmail,
}: EmployeeEmailParams) {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Employee Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 24px;">New Employee Notification</h1>
    <p style="color: #666; margin: 0; font-size: 14px;">A new employee has been added at one of your facilities.</p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #666; width: 140px;">Employee:</td>
        <td style="padding: 8px 0; font-weight: 500;">${employeeName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Position:</td>
        <td style="padding: 8px 0; font-weight: 500;">${position}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Facility:</td>
        <td style="padding: 8px 0; font-weight: 500;">${facilityName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Hire Date:</td>
        <td style="padding: 8px 0; font-weight: 500;">${hireDate || 'Not specified'}</td>
      </tr>
    </table>
  </div>

  <div style="text-align: center; margin: 30px 0; padding: 16px; background-color: #e0f2fe; border-radius: 6px;">
    <p style="margin: 0; color: #0369a1; font-size: 14px; font-weight: 500;">Please log in to BHP Connect to view full employee details and documentation.</p>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
    <p style="margin: 0 0 8px 0;">This email was sent from <strong>BHP Connect</strong></p>
    <p style="margin: 0;">Sent on behalf of ${bhpName}</p>
  </div>
</body>
</html>
  `.trim();

  return getResendClient().emails.send({
    from: `${facilityName} via BHP Connect <notifications@bhpconnekt.com>`,
    replyTo: bhpEmail,
    to,
    subject: `New Employee: ${employeeName}`,
    html: emailHtml,
  });
}

interface InvitationEmailParams {
  to: string;
  inviterName: string;
  facilityName: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
}

export async function sendInvitationEmail({
  to,
  inviterName,
  facilityName,
  role,
  inviteUrl,
  expiresAt,
}: InvitationEmailParams) {
  const expiresIn = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${facilityName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 24px;">You're Invited!</h1>
    <p style="color: #666; margin: 0; font-size: 14px;">Join ${facilityName} on BHP Connect</p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
    <p style="margin: 0 0 16px 0;">Hi,</p>
    <p style="margin: 0 0 16px 0;">
      <strong>${inviterName}</strong> has invited you to join <strong>${facilityName}</strong> as a <strong>${role}</strong> on BHP Connect.
    </p>
    <p style="margin: 0 0 24px 0;">
      Click the button below to create your account and join the team:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
    </div>

    <p style="margin: 16px 0 0 0; font-size: 14px; color: #666;">
      This invitation expires in <strong>${expiresIn} days</strong>.
    </p>
  </div>

  <div style="text-align: center; margin: 20px 0; padding: 16px; background-color: #fef3c7; border-radius: 6px;">
    <p style="margin: 0; color: #92400e; font-size: 13px;">
      If you did not expect this invitation, you can safely ignore this email.
    </p>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
    <p style="margin: 0 0 8px 0;">This email was sent from <strong>BHP Connect</strong></p>
    <p style="margin: 0; color: #999; font-size: 11px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${inviteUrl}" style="color: #2563eb; word-break: break-all;">${inviteUrl}</a>
    </p>
  </div>
</body>
</html>
  `.trim();

  return getResendClient().emails.send({
    from: `${facilityName} via BHP Connect <notifications@bhpconnekt.com>`,
    to,
    subject: `You're invited to join ${facilityName} on BHP Connect`,
    html: emailHtml,
  });
}
