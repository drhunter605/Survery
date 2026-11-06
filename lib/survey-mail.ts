import nodemailer from 'nodemailer';
import { randomBytes } from 'node:crypto';

export class SubmissionError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly publicMessage: string,
  ) {
    super(publicMessage);
    this.name = 'SubmissionError';
  }
}

type SubmissionBody = {
  answers?: unknown;
  comment?: unknown;
  contactInfo?: unknown;
};

type SubmissionResult = {
  referenceId: string;
  contactRequestSent: boolean | null;
  warning?: string;
};

function mailSettings() {
  const user = process.env.SMTP_USER?.trim() || '';
  const password = process.env.SMTP_PASS?.replace(/\s+/g, '') || '';
  const recipient = process.env.SURVEY_OWNER_EMAIL?.trim() || user;
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return { user, password, recipient, host, port, secure };
}

export function isMailConfigured(): boolean {
  const settings = mailSettings();
  return Boolean(
    settings.user &&
    settings.password &&
    settings.recipient &&
    Number.isInteger(settings.port) &&
    settings.port > 0,
  );
}

function createTransporter() {
  const settings = mailSettings();
  if (!isMailConfigured()) {
    throw new SubmissionError(
      503,
      'Email delivery is not configured yet. Please try again later.',
    );
  }

  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    requireTLS: !settings.secure,
    auth: {
      user: settings.user,
      pass: settings.password,
    },
    tls: {
      minVersion: 'TLSv1.2',
    },
  });
}

function formatAnswer(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ');
  }
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'string' ? value : String(value);
}

function makeReferenceId(): string {
  const first = randomBytes(2).toString('hex').toUpperCase();
  const second = randomBytes(2).toString('hex').toUpperCase();
  return `SURV-${first}-${second}`;
}

async function sendToOrganizer(
  subject: string,
  text: string,
): Promise<void> {
  const settings = mailSettings();
  const transporter = createTransporter();

  const result = await transporter.sendMail({
    from: settings.user,
    to: settings.recipient,
    subject,
    text,
  });

  if (!result.accepted || result.accepted.length === 0) {
    throw new Error('The mail server did not accept the recipient.');
  }
}

export async function submitSurveyByEmail(
  input: SubmissionBody,
): Promise<SubmissionResult> {
  if (
    !input ||
    typeof input.answers !== 'object' ||
    input.answers === null ||
    Array.isArray(input.answers)
  ) {
    throw new SubmissionError(400, 'Please review your survey and try again.');
  }

  const rawAnswers = input.answers as Record<string, unknown>;
  const comment = typeof input.comment === 'string' ? input.comment.trim() : '';
  const contactInfo =
    typeof input.contactInfo === 'string' ? input.contactInfo.trim() : '';

  if (comment.length > 10000 || contactInfo.length > 500) {
    throw new SubmissionError(
      400,
      'Your comment or contact information is too long. Please shorten it and try again.',
    );
  }

  // Question 13 only controls whether the separate contact request is sent.
  // It is intentionally excluded from the survey record.
  const { '13': contactConsent, ...surveyAnswers } = rawAnswers;
  const referenceId = makeReferenceId();
  const submittedAt = new Date().toISOString();
  const answerLines = Object.entries(surveyAnswers)
    .map(([question, answer]) => `Q${question}: ${formatAnswer(answer)}`)
    .join('\n');

  const surveyBody = [
    'LATESTHIRE — NEW WORKPLACE FAIRNESS SURVEY',
    '==================================================',
    `Reference ID: ${referenceId}`,
    `Submitted: ${submittedAt}`,
    '',
    'SURVEY ANSWERS',
    '--------------------------------------------------',
    answerLines || 'No answers were provided.',
    '',
    'ADDITIONAL COMMENT',
    '--------------------------------------------------',
    comment || 'No comment provided.',
    '',
    'This email is the permanent record of this survey submission.',
    'Optional contact requests are sent in a separate email and are not attached to this response.',
  ].join('\n');

  // The survey is not confirmed unless Gmail's SMTP server accepts it.
  try {
    await sendToOrganizer(
      `[LatestHire Survey] ${referenceId}`,
      surveyBody,
    );
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: unknown }).code)
        : 'MAIL_DELIVERY_ERROR';
    console.error('[LatestHire] Survey email delivery failed:', code);
    throw new SubmissionError(
      502,
      'We could not confirm that your survey reached the organizer. Please wait before trying again, or contact the organizer, to avoid sending a duplicate.',
    );
  }

  const consentGiven =
    contactConsent === 'Yes.' ||
    contactConsent === 'Maybe, I would like more information.';

  let contactRequestSent: boolean | null = null;
  let warning: string | undefined;

  if (consentGiven && contactInfo) {
    try {
      // This separate message deliberately contains no survey answers,
      // response reference ID, or survey submission identifier.
      await sendToOrganizer(
        '[LatestHire] Private Contact Request',
        [
          'A survey participant asked to be contacted privately.',
          '',
          'Contact information supplied:',
          contactInfo,
          '',
          'This is a separate contact request. It does not contain or identify a survey response.',
        ].join('\n'),
      );
      contactRequestSent = true;
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : 'MAIL_DELIVERY_ERROR';
      console.error('[LatestHire] Separate contact email failed:', code);
      contactRequestSent = false;
      warning =
        'Your survey was received, but your separate request for private follow-up could not be delivered. Please contact the organizer directly if you still want a reply.';
    }
  }

  return { referenceId, contactRequestSent, warning };
}
