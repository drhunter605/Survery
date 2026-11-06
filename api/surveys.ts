import {
  SubmissionError,
  submitSurveyByEmail,
} from '../lib/survey-mail.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.',
    });
  }

  try {
    const result = await submitSurveyByEmail(req.body);
    return res.status(200).json({
      success: true,
      referenceId: result.referenceId,
    });
  } catch (error) {
    if (error instanceof SubmissionError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.publicMessage,
      });
    }

    console.error(
      '[LatestHire] Unexpected submission error:',
      error instanceof Error ? error.name : 'UnknownError',
    );

    return res.status(500).json({
      success: false,
      message: 'The survey could not be processed. Please try again later.',
    });
  }
}
