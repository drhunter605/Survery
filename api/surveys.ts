import nodemailer from 'nodemailer';
import { randomBytes } from 'node:crypto';

function getMailConfig() {
  const user = process.env.SMTP_USER?.trim() || '';
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '') || '';
  const to = process.env.SURVEY_OWNER_EMAIL?.trim() || user;
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);

  return { user, pass, to, host, port };
}

function makeReferenceId() {
  return `SURV-${randomBytes(3).toString('hex').toUpperCase()}`;
}

function answerText(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (value === null || value === undefined) return '';
  return String(value);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { user, pass, to, host, port } = getMailConfig();
  if (!user || !pass || !to || !Number.isInteger(port) || port <= 0) {
    return res.status(503).json({
      success: false,
      message: 'Survey email is not configured yet. Please contact the organizer.',
    });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const answers = body.answers;
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return res.status(400).json({
      success: false,
      message: 'Please review your survey and try again.',
    });
  }

  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  if (comment.length > 10000) {
    return res.status(400).json({
      success: false,
      message: 'Your comment is too long. Please shorten it and try again.',
    });
  }

  // Keep the optional contact preference out of the survey email.
  const { '13': _contactPreference, ...surveyAnswers } =
    answers as Record<string, unknown>;

  const referenceId = makeReferenceId();
  const submittedAt = new Date().toISOString();
  const formattedAnswers = Object.entries(surveyAnswers)
    .map(([question, answer]) => `Q${question}: ${answerText(answer)}`)
    .join('\n');

  const emailText = [
    'LATESTHIRE — NEW WORKPLACE FAIRNESS SURVEY',
    '==================================================',
    `Reference ID: ${referenceId}`,
    `Submitted: ${submittedAt}`,
    '',
    'SURVEY ANSWERS',
    '--------------------------------------------------',
    formattedAnswers || 'No answers were provided.',
    '',
    'ADDITIONAL COMMENT',
    '--------------------------------------------------',
    comment || 'No comment provided.',
  ].join('\n');

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
      subject: `[LatestHire Survey] ${referenceId}`,
      text: emailText,
    });

    if (!result.accepted || result.accepted.length === 0) {
      throw new Error('Recipient was not accepted by the SMTP server.');
    }

    return res.status(200).json({ success: true, referenceId });
  } catch {
    return res.status(502).json({
      success: false,
      message: 'The survey email could not be sent. Your answers have not been confirmed as received. Please try again later.',
    });
  } finally {
    transporter.close();
  }
}
