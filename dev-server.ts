import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  isMailConfigured,
  SubmissionError,
  submitSurveyByEmail,
} from './lib/survey-mail';

async function start() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      service: 'LatestHire Survey API',
      archive: 'Gmail inbox',
      emailConfigured: isMailConfigured(),
    });
  });

  app.post('/api/surveys', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const result = await submitSurveyByEmail(req.body);
      res.json({
        success: true,
        referenceId: result.referenceId,
        contactRequestSent: result.contactRequestSent,
        warning: result.warning,
      });
    } catch (error) {
      if (error instanceof SubmissionError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.publicMessage,
        });
      } else {
        console.error(
          '[LatestHire] Unexpected local submission error:',
          error instanceof Error ? error.name : 'UnknownError',
        );
        res.status(500).json({
          success: false,
          message: 'The survey could not be processed. Please try again later.',
        });
      }
    }
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[LatestHire] Local server listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('[LatestHire] Failed to start local server:', error);
  process.exit(1);
});
