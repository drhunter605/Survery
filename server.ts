import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface SurveySubmission {
  id: string;
  referenceId: string;
  submittedAt: string;
  answers: Record<string, any>;
  comment?: string;
  contactInfo?: string;
}

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  referenceId: string;
  timestamp: string;
  status: 'sent' | 'queued';
}

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Error creating DATA_DIR:', e);
  }
}

const SURVEYS_FILE = path.join(DATA_DIR, 'surveys.json');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');

function loadSurveys(): SurveySubmission[] {
  try {
    if (fs.existsSync(SURVEYS_FILE)) {
      const data = fs.readFileSync(SURVEYS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading surveys:', e);
  }
  return [];
}

function saveSurveys(surveys: SurveySubmission[]) {
  try {
    fs.writeFileSync(SURVEYS_FILE, JSON.stringify(surveys, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving surveys:', e);
  }
}

function loadEmails(): EmailLog[] {
  try {
    if (fs.existsSync(EMAILS_FILE)) {
      const data = fs.readFileSync(EMAILS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading emails:', e);
  }
  return [];
}

function saveEmails(emails: EmailLog[]) {
  try {
    fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving emails:', e);
  }
}

function generateReferenceId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let segment1 = '';
  let segment2 = '';
  for (let i = 0; i < 4; i++) segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 4; i++) segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  return `SURV-${segment1}-${segment2}`;
}

const app = express();
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'usace_fairness_2026';
const SURVEY_OWNER_EMAIL = process.env.SURVEY_OWNER_EMAIL || 'locksurverypitt@gmail.com';
const activeAdminTokens = new Set<string>();

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    activeAdminTokens.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Invalid administrator password.' });
  }
});

// Auth Middleware
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (token && activeAdminTokens.has(token)) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized. Administrator access required.' });
  }
};

// Submit Survey
app.post('/api/surveys', (req: Request, res: Response) => {
  try {
    const { answers, comment, contactInfo } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid survey answers.' });
    }

    const referenceId = generateReferenceId();
    const submission: SurveySubmission = {
      id: Math.random().toString(36).substring(2, 9),
      referenceId,
      submittedAt: new Date().toISOString(),
      answers,
      comment: comment ? String(comment).trim() : undefined,
      contactInfo: contactInfo ? String(contactInfo).trim() : undefined,
    };

    const surveys = loadSurveys();
    surveys.push(submission);
    saveSurveys(surveys);

    // Generate Email Dispatch
    const emailBody = `
==================================================
WORKPLACE FAIRNESS SURVEY - NEW SUBMISSION
==================================================
Reference ID: ${referenceId}
Submitted At: ${new Date(submission.submittedAt).toLocaleString()}
Contact Info (Optional): ${submission.contactInfo || 'Not provided / Anonymous'}

--- ANSWERS ---
${Object.entries(answers)
  .map(([q, ans]) => `Q${q}: ${Array.isArray(ans) ? ans.join(', ') : ans}`)
  .join('\n')}

--- WRITTEN COMMENT ---
${submission.comment || 'No comment provided.'}
==================================================
    `.trim();

    const emailLog: EmailLog = {
      id: Math.random().toString(36).substring(2, 9),
      recipient: SURVEY_OWNER_EMAIL,
      subject: `[Survey Submission] ${referenceId}`,
      body: emailBody,
      referenceId,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    const emails = loadEmails();
    emails.unshift(emailLog);
    saveEmails(emails);

    console.log(`[Survey Submitted] Ref: ${referenceId} | Email queued/sent to ${SURVEY_OWNER_EMAIL}`);

    res.json({ success: true, referenceId });
  } catch (error) {
    console.error('Error submitting survey:', error);
    res.status(500).json({ success: false, message: 'Internal server error while saving response.' });
  }
});

// Admin Get All Surveys
app.get('/api/admin/surveys', requireAdmin, (req: Request, res: Response) => {
  const surveys = loadSurveys();
  res.json({ success: true, surveys });
});

// Admin Delete Survey
app.delete('/api/admin/surveys/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  let surveys = loadSurveys();
  const initialLength = surveys.length;
  surveys = surveys.filter((s) => s.id !== id && s.referenceId !== id);
  if (surveys.length < initialLength) {
    saveSurveys(surveys);
    res.json({ success: true, message: 'Submission deleted successfully.' });
  } else {
    res.status(404).json({ success: false, message: 'Submission not found.' });
  }
});

// Admin Delete All Surveys
app.delete('/api/admin/surveys', requireAdmin, (req: Request, res: Response) => {
  saveSurveys([]);
  saveEmails([]);
  res.json({ success: true, message: 'All survey submissions and logs deleted.' });
});

// Admin Get Email Outbox Logs
app.get('/api/admin/emails', requireAdmin, (req: Request, res: Response) => {
  const emails = loadEmails();
  res.json({ success: true, emails });
});

// Admin Backup Download
app.get('/api/admin/backup', requireAdmin, (req: Request, res: Response) => {
  const surveys = loadSurveys();
  const emails = loadEmails();
  const backupData = {
    exportedAt: new Date().toISOString(),
    totalResponses: surveys.length,
    surveys,
    emails,
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=survey-backup-${Date.now()}.json`);
  res.send(JSON.stringify(backupData, null, 2));
});

// Admin Statistics & Analytics Endpoint
app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  const surveys = loadSurveys();
  const total = surveys.length;

  // Suppression filter check (< 10 responses warning)
  const suppressBreakdown = total < 10;

  // Question-wise distribution
  const distributions: Record<string, Record<string, number>> = {};

  surveys.forEach((s) => {
    Object.entries(s.answers).forEach(([qKey, val]) => {
      if (!distributions[qKey]) distributions[qKey] = {};
      if (Array.isArray(val)) {
        val.forEach((item) => {
          distributions[qKey][item] = (distributions[qKey][item] || 0) + 1;
        });
      } else if (val !== null && val !== undefined) {
        const strVal = String(val);
        distributions[qKey][strVal] = (distributions[qKey][strVal] || 0) + 1;
      }
    });
  });

  const experienceBreakdown = {
    personalExperience: 0,
    directObservation: 0,
    secondhandReport: 0,
    noneOrOther: 0,
  };

  surveys.forEach((s) => {
    const ans = s.answers;
    let hasPersonal = false;
    let hasWitnessed = false;
    let hasSecondhand = false;

    [6, 7, 8, 9, 11].forEach((qNum) => {
      const val = ans[String(qNum)];
      if (val) {
        const str = String(val).toLowerCase();
        if (str.includes('personally') || str.includes('affected')) hasPersonal = true;
        if (str.includes('witnessed') || str.includes('witness')) hasWitnessed = true;
        if (str.includes('heard about')) hasSecondhand = true;
      }
    });

    if (hasPersonal) experienceBreakdown.personalExperience++;
    else if (hasWitnessed) experienceBreakdown.directObservation++;
    else if (hasSecondhand) experienceBreakdown.secondhandReport++;
    else experienceBreakdown.noneOrOther++;
  });

  res.json({
    success: true,
    totalResponses: total,
    suppressBreakdown,
    distributions,
    experienceBreakdown,
  });
});

// If not on Vercel, set up Vite middleware and start standalone server
if (!process.env.VERCEL) {
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  }).then((vite) => {
    app.use(vite.middlewares);
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`[Server] Running on http://localhost:${port}`);
    });
  }).catch((err) => {
    console.error('Failed to start Vite server:', err);
  });
}

export default app;
