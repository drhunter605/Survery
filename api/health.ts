import { isMailConfigured } from '../lib/survey-mail';

export default function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  }

  return res.status(200).json({
    ok: true,
    service: 'LatestHire Survey API',
    archive: 'Gmail inbox',
    emailConfigured: isMailConfigured(),
  });
}
