import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const user = process.env.SMTP_USER?.trim() || '';
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '') || '';
  const to = process.env.SURVEY_OWNER_EMAIL?.trim() || user;
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);

  if (!user || !pass || !to || !Number.isInteger(port) || port <= 0) {
    return res.status(503).json({
      success: false,
      message: 'Private follow-up email is not configured.',
    });
  }

  const contactInfo =
    typeof req.body?.contactInfo === 'string' ? req.body.contactInfo.trim() : '';

  if (!contactInfo || contactInfo.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Please enter valid contact information.',
    });
  }

  // This message contains only contact details. It has no survey answers,
  // response reference ID, or identifier linking it to a survey submission.
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 7000,
    socketTimeout: 10000,
    tls: { minVersion: 'TLSv1.2' },
  });

  try {
    const result = await transporter.sendMail({
      from: user,
      to,
      subject: '[LatestHire] Private Contact Request',
      text: [
        'A survey participant asked to be contacted privately.',
        '',
        'Contact information supplied:',
        contactInfo,
        '',
        'This is a separate contact request and does not include or identify a survey response.',
      ].join('\n'),
    });

    if (!result.accepted || result.accepted.length === 0) {
      throw new Error('Recipient was not accepted by the SMTP server.');
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(502).json({
      success: false,
      message: 'Your survey was received, but your separate contact request could not be emailed.',
    });
  } finally {
    transporter.close();
  }
}
