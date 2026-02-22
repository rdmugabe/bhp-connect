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
  dateOfBirth: string;
  admissionDate: string | null;
  facilityName: string;
  insuranceProvider: string | null;
  policyNumber: string | null;
  bhpName: string;
  residentId: string;
}

export async function sendEnrollmentEmail({
  to,
  residentName,
  dateOfBirth,
  admissionDate,
  facilityName,
  insuranceProvider,
  policyNumber,
  bhpName,
  residentId,
}: EnrollmentEmailParams) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const viewIntakeUrl = `${baseUrl}/bhp/residents/${residentId}`;

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
    <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">Resident Information</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #666; width: 140px;">Full Name:</td>
        <td style="padding: 8px 0; font-weight: 500;">${residentName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Date of Birth:</td>
        <td style="padding: 8px 0; font-weight: 500;">${dateOfBirth}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Admission Date:</td>
        <td style="padding: 8px 0; font-weight: 500;">${admissionDate || 'Not specified'}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Facility:</td>
        <td style="padding: 8px 0; font-weight: 500;">${facilityName}</td>
      </tr>
    </table>
  </div>

  ${insuranceProvider ? `
  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
    <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">Insurance Information</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #666; width: 140px;">Provider:</td>
        <td style="padding: 8px 0; font-weight: 500;">${insuranceProvider}</td>
      </tr>
      ${policyNumber ? `
      <tr>
        <td style="padding: 8px 0; color: #666;">Policy Number:</td>
        <td style="padding: 8px 0; font-weight: 500;">${policyNumber}</td>
      </tr>
      ` : ''}
    </table>
  </div>
  ` : ''}

  <div style="text-align: center; margin: 30px 0;">
    <a href="${viewIntakeUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">View Full Intake</a>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
    <p style="margin: 0 0 8px 0;">This email was sent from <strong>BHP Connect</strong></p>
    <p style="margin: 0;">Sent on behalf of ${bhpName}</p>
  </div>
</body>
</html>
  `.trim();

  return getResendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'BHP Connect <notifications@bhpconnect.com>',
    to,
    subject: `New Resident Enrollment: ${residentName}`,
    html: emailHtml,
  });
}
