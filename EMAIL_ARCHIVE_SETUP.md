# LatestHire — Gmail archive mode

Survey answers are sent directly to the organizer's Gmail inbox. The application does not save survey submissions to a local JSON file, Vercel /tmp, or a database.

## Required Vercel environment variables

Set these under Project → Settings → Environment Variables for **Production**:

- `SURVEY_OWNER_EMAIL` — `locksurveyspitt@gmail.com`
- `SMTP_USER` — `locksurveyspitt@gmail.com`
- `SMTP_PASS` — Google App Password generated for this Gmail account (remove spaces)
- `SMTP_HOST` — `smtp.gmail.com`
- `SMTP_PORT` — `587`

Keep these server-side only. Do not prefix them with `VITE_`, put them in frontend code, or commit actual values to GitHub.

After saving the variables, redeploy the production project.

## How submission works

1. The browser posts answers to `/api/surveys`.
2. The Vercel function sends the survey email to `SURVEY_OWNER_EMAIL`.
3. The response is confirmed only after the SMTP server accepts the survey email.
4. If the participant separately requested contact and supplied contact details, those details are sent in a second email with no survey answers or response reference ID.
5. No survey response, contact request, or email log is stored by the website.

The reference ID is included in the survey email subject and completion page so the organizer can search Gmail. It does not connect the separate contact-request email to a survey response.

## Test endpoints

- `GET /api/health` returns service status and whether SMTP variables are present (never their values).
- `POST /api/surveys` submits a survey.

## Important limitations

- Gmail acceptance by SMTP is not proof of inbox placement. Check Spam and All Mail during testing.
- Gmail sending quotas apply. A personal Gmail account has daily sending limits; check Google's current limits before a large survey campaign.
- If the SMTP connection times out after Gmail accepted a message but before the browser receives confirmation, a participant retry can create a duplicate email. The survey reference ID helps identify duplicates.
- Gmail is the archive. If the account is lost, disabled, or messages are deleted, the website has no independent backup. Enable account recovery and consider Gmail/Google Takeout backups.
- Do not tell participants their response is permanently backed up by the website. The website sends it to the organizer's email and does not retain a copy.
