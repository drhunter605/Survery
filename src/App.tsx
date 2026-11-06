import React, { useState } from 'react';
import { ShieldCheck, QrCode, ChevronRight, ChevronLeft, ArrowRight, Info, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Survey Questions Definition
interface QuestionDef {
  id: string;
  section: string;
  title: string;
  type: 'radio' | 'checkbox' | 'text';
  options?: string[];
  helper?: string;
}

const SURVEY_QUESTIONS: QuestionDef[] = [
  // Section A
  {
    id: '1',
    section: 'SECTION A — WORK AREA',
    title: 'Which area do you primarily work in?',
    type: 'radio',
    options: [
      'Ohio River',
      'Monongahela River',
      'Allegheny River',
      'Federal Building / Office',
      'Fleet Maintenance',
      'More than one area',
      'Other',
      'Prefer not to answer'
    ]
  },
  {
    id: '2',
    section: 'SECTION A — WORK AREA',
    title: 'Which of these best describes your experience with hiring or promotions? Select all that apply.',
    type: 'checkbox',
    helper: 'Please think about the past three years, or the time you have worked here if less than three years.',
    options: [
      'I have applied for a job or promotion.',
      'I have helped choose someone for a job or promotion.',
      'I have personally witnessed a hiring or promotion decision.',
      'I have heard coworkers discuss concerns about hiring or promotions.',
      'None of these.',
      'Prefer not to answer.'
    ]
  },
  // Section B
  {
    id: '3',
    section: 'SECTION B — HIRING PRACTICES',
    title: 'Are job openings shared so qualified employees have a fair chance to apply?',
    type: 'radio',
    options: ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never', 'Not sure', 'Prefer not to answer']
  },
  {
    id: '4',
    section: 'SECTION B — HIRING PRACTICES',
    title: 'Are the requirements for a job or promotion explained before someone is selected?',
    type: 'radio',
    options: ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never', 'Not sure', 'Prefer not to answer']
  },
  {
    id: '5',
    section: 'SECTION B — HIRING PRACTICES',
    title: 'Are the same requirements followed when choosing between job applicants or employees for promotions?',
    type: 'radio',
    options: ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never', 'Not sure', 'Prefer not to answer']
  },
  // Section C
  {
    id: '6',
    section: 'SECTION C — FAMILY AND PERSONAL CONNECTIONS',
    title: 'Do you know of a situation where someone hired or promoted was a family member of a person involved in the selection process?',
    type: 'radio',
    options: [
      'Yes, and I was personally affected.',
      'Yes, I personally witnessed the situation.',
      'Yes, I know of the family relationship but did not witness the selection.',
      'I only heard about it from someone else.',
      'No.',
      'Not sure.',
      'Prefer not to answer.'
    ]
  },
  {
    id: '7',
    section: 'SECTION C — FAMILY AND PERSONAL CONNECTIONS',
    title: 'Do you know of a situation where someone hired or promoted had a close friendship or personal connection with a person involved in the selection process?',
    type: 'radio',
    options: [
      'Yes, and I was personally affected.',
      'Yes, I personally witnessed the situation.',
      'Yes, I know of the personal connection but did not witness the selection.',
      'I only heard about it from someone else.',
      'No.',
      'Not sure.',
      'Prefer not to answer.'
    ]
  },
  {
    id: '8',
    section: 'SECTION C — FAMILY AND PERSONAL CONNECTIONS',
    title: 'In either of these situations, do you know whether the person with the family or personal connection took part in choosing the successful applicant?',
    type: 'radio',
    options: [
      'Yes.',
      'No.',
      'I am not sure.',
      'I have no knowledge of this.',
      'Prefer not to answer.'
    ]
  },
  {
    id: '9',
    section: 'SECTION C — FAMILY AND PERSONAL CONNECTIONS',
    title: 'Have you personally seen or experienced someone receiving special treatment during a hiring or promotion process that other applicants or employees did not receive?',
    type: 'radio',
    options: [
      'Yes, I was personally affected.',
      'Yes, I personally witnessed it.',
      'I only heard about it from someone else.',
      'No.',
      'Not sure.',
      'Prefer not to answer.'
    ]
  },
  {
    id: '10',
    section: 'SECTION C — FAMILY AND PERSONAL CONNECTIONS',
    title: 'Where have you seen or heard about possible favoritism? Select all that apply.',
    type: 'checkbox',
    options: [
      'Hiring new employees.',
      'Promotions.',
      'Transfers.',
      'Temporary or acting positions.',
      'Special assignments.',
      'Other.',
      'Not sure.',
      'Prefer not to answer.'
    ]
  },
  // Section D
  {
    id: '11',
    section: 'SECTION D — IDENTIFYING PATTERNS',
    title: 'Based on what you have personally experienced or witnessed, how often have you seen family relationships or personal connections appear to influence hiring or promotion decisions?',
    type: 'radio',
    options: [
      'Never.',
      'Once.',
      'Two or three times.',
      'Four or more times.',
      'Not sure.',
      'Prefer not to answer.'
    ]
  },
  // Section E
  {
    id: '12',
    section: 'SECTION E — ADDITIONAL INFORMATION',
    title: 'Is there anything else you would like to share about hiring decisions, family connections, friendships, or favoritism?',
    type: 'text',
    helper: 'Please do not include names, specific job titles, exact dates, or information that could identify you or another employee. Do not share classified or protected government information.'
  },
  // Optional Contact
  {
    id: '13',
    section: 'OPTIONAL — SPEAK WITH SURVEY ORGANIZER',
    title: 'Would you be willing to speak privately about your experiences?',
    type: 'radio',
    helper: 'Contact information must never be attached to survey responses.',
    options: [
      'Yes.',
      'No, I prefer to remain anonymous.',
      'Maybe, I would like more information.'
    ]
  }
];

export default function App() {
  const [view, setView] = useState<'intro' | 'survey' | 'success' | 'admin_login' | 'admin_dashboard'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [comment, setComment] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastReferenceId, setLastReferenceId] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  const handleAnswerChange = (questionId: string, value: any, type: 'radio' | 'checkbox' | 'text') => {
    if (type === 'checkbox') {
      const currentList = Array.isArray(answers[questionId]) ? [...answers[questionId]] : [];
      const index = currentList.indexOf(value);
      if (index > -1) {
        currentList.splice(index, 1);
      } else {
        currentList.push(value);
      }
      setAnswers({ ...answers, [questionId]: currentList });
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const submitSurvey = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, comment }),
      });

      const responseText = await res.text();
      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(`The survey server returned an unexpected response (HTTP ${res.status}). Please try again later.`);
      }

      if (!res.ok || !data.success) {
        alert(data.message || `Submission failed (HTTP ${res.status}). Please try again later.`);
        return;
      }

      setLastReferenceId(data.referenceId || '');

      const wantsContact =
        answers['13'] === 'Yes.' ||
        answers['13'] === 'Maybe, I would like more information.';

      if (wantsContact && contactInfo.trim()) {
        try {
          const contactRes = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactInfo }),
          });
          const contactText = await contactRes.text();
          let contactData: any;
          try {
            contactData = contactText ? JSON.parse(contactText) : {};
          } catch {
            contactData = {};
          }

          if (!contactRes.ok || !contactData.success) {
            window.alert(
              contactData.message ||
              'Your survey was received, but your separate contact request could not be delivered.'
            );
          }
        } catch (contactError) {
          console.error('[LatestHire] Separate contact request failed:', contactError);
          window.alert(
            'Your survey was received, but your separate contact request could not be delivered. Please contact the organizer directly if you still want a reply.'
          );
        }
      }

      setView('success');
    } catch (err) {
      console.error('[LatestHire] Submission request failed:', err);
      const message = err instanceof Error
        ? err.message
        : 'We could not connect to the survey server. Please check your connection and try again.';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 p-2 rounded-lg text-white font-bold flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base md:text-lg tracking-tight block">Independent Employee Survey</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowQrModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors border border-slate-700"
          >
            <QrCode className="w-4 h-4" />
            Share Survey QR
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
        {/* VIEW 1: INTRO */}
        {view === 'intro' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 space-y-8">
            <div className="border-b border-slate-100 pb-6 space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                Independent Voluntary Survey
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                YOUR VOICE MATTERS
              </h1>
              <h2 className="text-xl md:text-2xl font-bold text-amber-700 tracking-tight">
                Let's Make Hiring Fair for Everyone.
              </h2>
            </div>

            <div className="space-y-4 text-slate-700 leading-relaxed text-base">
              <p className="font-semibold text-slate-900">Hello, fellow employees.</p>
              
              <p>
                For years, there have been concerns about favoritism, nepotism, and cronyism in our workplace. Employees deserve a fair opportunity to get hired and promoted based on their qualifications, not who they know, who they're related to, or who they're friends with.
              </p>
              
              <p>
                I'm conducting this survey to find out how widespread these concerns really are and to help bring about fairer, more open hiring practices.
              </p>

              <div className="space-y-2 pt-2">
                <h3 className="text-base font-bold text-slate-900">Who am I?</h3>
                <p>
                  I'm a fellow employee conducting this survey independently. I do not represent USACE, management, or any government agency. This is not an official government survey or investigation.
                </p>
              </div>

              <div className="space-y-3 pt-2 bg-slate-50 border border-slate-200 p-5 rounded-xl">
                <h3 className="text-base font-bold text-slate-900">Your privacy matters</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-sm">
                  <li>Participation is completely voluntary.</li>
                  <li>You do not have to provide your name, email, or employee number.</li>
                  <li>You can skip any question.</li>
                  <li>Your survey answers will not be publicly displayed.</li>
                  <li>Contact information, if provided, will be collected separately from survey answers.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-base font-bold text-slate-900">Why participate?</h3>
                <p>
                  Whether you've experienced favoritism, witnessed questionable hiring decisions, heard concerns from coworkers, or believe hiring practices are fair, your input matters.
                </p>
                <p>
                  A single complaint can easily be brushed aside as an isolated issue. <strong>But when enough employees share similar experiences, patterns become harder to ignore.</strong> Collecting responses from employees across different work areas gives us a clearer picture and a stronger basis for asking for meaningful change.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 font-semibold text-center text-sm">
                This isn't about targeting individuals. It's about fairness, accountability, and equal opportunities for everyone.
              </div>

              <p className="text-slate-600 text-center pt-2">
                Thank you for taking a few minutes to participate.
              </p>

              <p className="font-bold text-center text-slate-900 text-base">
                Fair opportunities should be based on qualifications, not connections.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-400" />
                Takes approximately 3–5 minutes. All questions are optional.
              </div>
              <button
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setView('survey');
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide"
              >
                BEGIN THE SURVEY
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: SURVEY QUESTIONNAIRE */}
        {view === 'survey' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 space-y-8">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>{SURVEY_QUESTIONS[currentQuestionIndex].section}</span>
                <span>Question {currentQuestionIndex + 1} of {SURVEY_QUESTIONS.length}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-600 h-full transition-all duration-300" 
                  style={{ width: `${((currentQuestionIndex + 1) / SURVEY_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="space-y-6 pt-4">
              {currentQuestionIndex === 5 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2 text-sm">
                  <h3 className="font-semibold text-slate-900">What do these terms mean?</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
                    <li><strong>Nepotism:</strong> Favoring a family member.</li>
                    <li><strong>Cronyism:</strong> Favoring a friend or personal connection.</li>
                    <li><strong>Favoritism:</strong> Giving someone better treatment than others for personal reasons.</li>
                  </ul>
                  <p className="text-xs text-slate-500 italic pt-1">
                    Having a family member or friend at work does not automatically mean favoritism has occurred.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
                  {currentQuestionIndex + 1}. {SURVEY_QUESTIONS[currentQuestionIndex].title}
                </h2>
                {SURVEY_QUESTIONS[currentQuestionIndex].helper && (
                  <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    {SURVEY_QUESTIONS[currentQuestionIndex].helper}
                  </p>
                )}
                <span className="text-xs text-slate-400 block italic">Every question is optional. You may skip if desired.</span>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {SURVEY_QUESTIONS[currentQuestionIndex].type === 'radio' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {SURVEY_QUESTIONS[currentQuestionIndex].options?.map((opt, idx) => {
                        const qId = SURVEY_QUESTIONS[currentQuestionIndex].id;
                        const isSelected = answers[qId] === opt;
                        return (
                          <label
                            key={idx}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-amber-600 bg-amber-50/40 text-slate-900 font-medium' 
                                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q_${qId}`}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(qId, opt, 'radio')}
                              className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        );
                      })}
                    </div>

                    {currentQuestionIndex === 12 && (answers['13'] === 'Yes.' || answers['13'] === 'Maybe, I would like more information.') && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <label className="block text-xs font-semibold text-slate-700">Optional: Provide your email address or phone number</label>
                        <input
                          type="text"
                          value={contactInfo}
                          onChange={(e) => setContactInfo(e.target.value)}
                          placeholder="e.g., employee@example.com or phone number..."
                          className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                        <p className="text-xs text-slate-500">Contact information is kept separate from survey responses to maintain your privacy.</p>
                      </div>
                    )}
                  </div>
                )}

                {SURVEY_QUESTIONS[currentQuestionIndex].type === 'checkbox' && (
                  <div className="space-y-2">
                    {SURVEY_QUESTIONS[currentQuestionIndex].options?.map((opt, idx) => {
                      const qId = SURVEY_QUESTIONS[currentQuestionIndex].id;
                      const selectedList = Array.isArray(answers[qId]) ? answers[qId] : [];
                      const isSelected = selectedList.includes(opt);
                      return (
                        <label
                          key={idx}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-amber-600 bg-amber-50/40 text-slate-900 font-medium' 
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleAnswerChange(qId, opt, 'checkbox')}
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {SURVEY_QUESTIONS[currentQuestionIndex].type === 'text' && (
                  <div className="space-y-4">
                    <textarea
                      rows={5}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Type your comments here (optional)..."
                      className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 space-y-1">
                      <strong className="block font-semibold">Important Notice:</strong>
                      Please do not include names, specific job titles, exact dates, or information that could identify you or another employee. Do not share classified or protected government information.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 ${
                  currentQuestionIndex === 0 
                    ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400' 
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {currentQuestionIndex < SURVEY_QUESTIONS.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-sm flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={submitSurvey}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'SUBMIT SURVEY'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: SUCCESS CONFIRMATION */}
        {view === 'success' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 space-y-8 text-left">
            <div className="border-b border-slate-100 pb-6 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                THANK YOU FOR SPEAKING UP
              </h1>
              <h2 className="text-xl md:text-2xl font-bold text-amber-700 tracking-tight">
                Your participation makes a difference.
              </h2>
            </div>

            <div className="space-y-4 text-slate-700 leading-relaxed text-base">
              <p>
                Thank you for taking the time to complete this survey.
              </p>
              
              <p>
                Whether your experiences have been positive, negative, or somewhere in between, your response helps build a clearer picture of hiring and promotion practices across our workforce.
              </p>

              <p>
                One response alone may not reveal much. But when employees from different buildings, rivers, and facilities share their experiences, it becomes easier to recognize patterns and identify areas where improvements may be needed.
              </p>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3">
                <h3 className="text-base font-bold text-slate-900">Help reach more employees</h3>
                <p className="font-semibold text-slate-900">
                  Please share this survey with your coworkers.
                </p>
                <p className="text-sm text-slate-600">
                  Our workforce is spread across multiple work areas, and we want to hear from employees throughout the organization. Someone at another facility may have a perspective or experience that hasn't been represented yet.
                </p>
                <p className="text-sm text-slate-600">
                  Use the buttons below to share the survey link or copy it to send personally.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 font-semibold text-center text-sm">
                The goal isn't to target individuals. It's to encourage fair, transparent hiring and promotion practices for everyone.
              </div>

              <p className="text-slate-600 text-center pt-2">
                Thank you for helping make every employee's voice count.
              </p>

              <p className="font-bold text-center text-slate-900 text-base">
                Fair opportunities should be based on qualifications, not connections.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto text-center space-y-1">
              <span className="text-xs text-slate-500 block uppercase font-semibold">Your Response Reference ID</span>
              <span className="text-lg font-mono font-bold text-slate-900 tracking-wider">{lastReferenceId}</span>
              <p className="text-xs text-slate-400 pt-1">Save this reference code if you wish to verify your submission.</p>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  setAnswers({});
                  setComment('');
                  setContactInfo('');
                  setCurrentQuestionIndex(0);
                  setView('intro');
                }}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm"
              >
                Return to Home
              </button>
              <button
                onClick={() => setShowQrModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <QrCode className="w-4 h-4" />
                Share Survey Link & QR
              </button>
            </div>
          </div>
        )}

        {/* SUBMISSION DETAILS MODAL */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-600 uppercase">{selectedSubmission.referenceId}</span>
                  <h2 className="text-lg font-bold text-slate-900">Submission Details</h2>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-slate-500">
                  <strong>Submitted At:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </p>

                {selectedSubmission.comment && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
                    <strong className="block font-semibold text-amber-900">Written Comment:</strong>
                    <p className="text-slate-700 italic">{selectedSubmission.comment}</p>
                  </div>
                )}

                {selectedSubmission.contactInfo && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
                    <strong className="block font-semibold text-emerald-900">Contact Info Provided:</strong>
                    <p className="text-slate-700 font-mono font-bold">{selectedSubmission.contactInfo}</p>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-1">Answers:</h3>
                  {Object.entries(selectedSubmission.answers).map(([qKey, val]: [string, any]) => {
                    const qDef = SURVEY_QUESTIONS.find(q => q.id === qKey);
                    return (
                      <div key={qKey} className="border-b border-slate-100 pb-3 space-y-1">
                        <strong className="block text-slate-800">Q{qKey}: {qDef ? qDef.title : ''}</strong>
                        <div className="text-slate-600 font-medium">
                          {Array.isArray(val) ? val.join(', ') : String(val)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => handleDeleteSubmission(selectedSubmission.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                >
                  Delete Submission
                </button>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR CODE SHARE MODAL */}
        {showQrModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-6 shadow-xl">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">Share Survey</h2>
                <p className="text-xs text-slate-500">Scan QR code to open survey on mobile device or copy link below.</p>
              </div>

              <div className="bg-white p-4 border border-slate-200 rounded-2xl inline-block shadow-sm">
                <QRCodeSVG value={window.location.href} size={180} level="H" />
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center text-slate-600 select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Survey link copied to clipboard!');
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl"
                >
                  Copy Survey Link
                </button>
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="text-xs text-slate-500 hover:underline pt-2"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-6 text-xs border-t border-slate-800 mt-auto">
        <div className="max-w-4xl mx-auto text-center">
          <p>Independent Voluntary Employee Initiative &copy; {new Date().getFullYear()}.</p>
          <button onClick={() => setView('intro')} className="mt-3 hover:text-white transition-colors">Survey Home</button>
        </div>
      </footer>ooter>
    </div>
  );
}
