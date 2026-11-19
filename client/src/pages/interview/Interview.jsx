import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  Award, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Send,
  MessageSquare,
  ShieldAlert,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Zap,
  Radio,
  Compass,
  Check
} from 'lucide-react';

export const Interview = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Setup Form State
  const [targetRole, setTargetRole] = useState('Full-Stack Developer');
  const [interviewType, setInterviewType] = useState('technical');
  const [difficulty, setDifficulty] = useState('entry_level');
  const [questionCount, setQuestionCount] = useState(3);

  // Active Session State
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showIdealAnswer, setShowIdealAnswer] = useState(false);

  // Persistent Voice Speech-to-Text (Microphone) State — uses MediaRecorder + Groq Whisper
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micStatusMessage, setMicStatusMessage] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Audio Text-to-Speech (Question Reader) State
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Backend AI Configuration State
  const [aiStatus, setAiStatus] = useState({ 
    configured: false, 
    groq_configured: false,
    groq_model: 'qwen/qwen3.8-27b',
    active_provider: 'groq'
  });

  // Check if MediaRecorder (audio recording) is supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setSpeechSupported(true);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchAiStatus();

    return () => {
      // Cleanup: stop any active recording and release mic
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = async () => {
    if (isSpeakingQuestion && speechSynthesisSupported) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Release the mic immediately so the browser indicator disappears
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        if (audioBlob.size < 100) {
          setMicStatusMessage('⚠️ No audio captured. Please try again and speak into your microphone.');
          return;
        }

        // Send to Groq Whisper via backend
        setIsTranscribing(true);
        setMicStatusMessage('⏳ Transcribing your speech with Groq Whisper AI...');

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const res = await api.post('/interview/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const transcribedText = res.data.text || '';
          if (transcribedText.trim()) {
            setCurrentAnswer(prev => {
              const existing = prev.trim();
              return existing ? `${existing} ${transcribedText.trim()}` : transcribedText.trim();
            });
            setMicStatusMessage('✅ Voice converted to text! You can verify, edit, or speak again before submitting.');
          } else {
            setMicStatusMessage('⚠️ Could not detect any speech. Please try again and speak clearly.');
          }
        } catch (err) {
          console.error('Transcription error:', err);
          setMicStatusMessage('⚠️ Transcription failed. Please check your backend is running and GROQ_API_KEY is set.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every 1 second
      setIsListening(true);
      setMicStatusMessage('🎙️ Recording... Speak naturally. Click "Done Speaking" when finished.');
    } catch (err) {
      console.error('Microphone access error:', err);
      setMicStatusMessage('❌ Microphone access was denied. Please allow microphone permission in your browser settings.');
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop(); // This triggers the onstop handler above
      } catch (e) {}
    } else {
      // Release mic if recorder didn't start properly
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleSpeakQuestion = (text) => {
    if (!speechSynthesisSupported) return;

    if (isSpeakingQuestion) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeakingQuestion(false);
      utterance.onerror = () => setIsSpeakingQuestion(false);
      setIsSpeakingQuestion(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchAiStatus = async () => {
    try {
      const res = await api.get('/auth/ai-status');
      setAiStatus(res.data);
    } catch (err) {
      console.error("Failed to load AI status", err);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/interview/user/history');
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load interview history", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();
    try {
      setStarting(true);
      const res = await api.post('/interview/start', {
        target_role: targetRole,
        interview_type: interviewType,
        difficulty: difficulty,
        question_count: questionCount
      });
      setSession(res.data);
      setCurrentAnswer('');
      accumulatedTextRef.current = '';
      setMicStatusMessage('');
      setShowIdealAnswer(false);
    } catch (err) {
      console.error("Failed to start interview", err);
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!currentAnswer.trim() || !session) return;

    stopListening();
    if (isSpeakingQuestion && speechSynthesisSupported) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    }

    const currentQ = session.questions[session.current_index];

    try {
      setSubmitting(true);
      const res = await api.post(`/interview/${session.id}/submit-answer`, {
        question_id: currentQ.id,
        user_answer: currentAnswer.trim()
      });
      setSession(res.data);
      setShowIdealAnswer(false);
    } catch (err) {
      console.error("Failed to evaluate answer", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    stopListening();
    if (isSpeakingQuestion && speechSynthesisSupported) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    }

    // Advance index smoothly to next question
    if (session && session.current_index < session.questions.length - 1) {
      setSession(prev => ({
        ...prev,
        current_index: prev.current_index + 1
      }));
    }

    // Completely clear previous answer so Question 2 starts clean
    setCurrentAnswer('');
    accumulatedTextRef.current = '';
    setMicStatusMessage('');
    setShowIdealAnswer(false);
  };

  const handleFinishOrReset = () => {
    stopListening();
    if (isSpeakingQuestion && speechSynthesisSupported) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    }
    setSession(null);
    setCurrentAnswer('');
    accumulatedTextRef.current = '';
    setMicStatusMessage('');
    fetchHistory();
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center animate-spin mb-4 shadow-premium">
          <Sparkles className="w-6 h-6 text-forest-300" />
        </div>
        <p className="text-sm font-semibold text-navy-800">Loading interview simulator...</p>
      </div>
    );
  }

  // Active or Completed Interview View
  if (session) {
    const isCompleted = session.status === 'completed';
    const currentQ = session.questions[session.current_index];
    const isAnswered = currentQ?.score !== null && currentQ?.score !== undefined;
    const isFlagged = currentQ?.score <= 1;

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Session Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-cream-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-forest-900 text-white flex items-center justify-center shadow-sm">
              <BrainCircuit className="w-5 h-5 text-forest-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-950">{session.target_role} Simulation</h2>
              <div className="text-xs text-navy-800/60 uppercase font-semibold tracking-wider flex items-center gap-2">
                <span>{session.interview_type} • {session.difficulty.replace('_', ' ')}</span>
                {aiStatus.groq_configured ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    • <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" /> Groq AI Evaluator Active
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    • ⚠️ Set GROQ_API_KEY in server/.env
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleFinishOrReset}
            className="btn-outline text-xs py-1.5 px-3"
          >
            Exit Session
          </button>
        </div>

        {/* If Completed Personalized Evaluation Debrief View */}
        {isCompleted ? (
          <div className="space-y-6">
            {/* Top Completion Banner */}
            <div className="card-premium p-6 sm:p-8 bg-gradient-to-br from-white via-cream-50/50 to-forest-50/30 border border-forest-200/80 shadow-premium">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-cream-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-forest-900 text-white flex items-center justify-center shrink-0 shadow-premium">
                    <Award className="w-8 h-8 text-forest-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 bg-forest-100/80 px-2.5 py-0.5 rounded-full border border-forest-200">
                        Evaluation Debrief Complete
                      </span>
                      <span className="text-xs text-navy-800/60 font-semibold">
                        {session.target_role} • {session.difficulty.replace('_', ' ')}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">
                      End-of-Round Hiring Decision
                    </h1>
                  </div>
                </div>

                {/* Score & Verdict Pill */}
                <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-cream-200 shadow-soft">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-navy-800/60 block">Hiring Verdict</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      session.hiring_verdict === 'Strong Hire' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      session.hiring_verdict === 'Hire' ? 'bg-teal-100 text-teal-800 border border-teal-300' :
                      session.hiring_verdict === 'Lean Hire' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {session.hiring_verdict || (session.overall_score >= 70 ? 'Hire' : 'Needs Development')}
                    </span>
                  </div>
                  <div className="h-10 w-px bg-cream-200" />
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-navy-800/60 block">Score</span>
                    <span className="text-2xl font-black text-navy-950">{session.overall_score || 0}<span className="text-xs text-navy-800/60 font-semibold">/100</span></span>
                  </div>
                </div>
              </div>

              {/* Readiness Credited Pill */}
              <div className="mt-4 p-3 rounded-xl bg-forest-50/80 border border-forest-200/80 text-xs font-semibold text-forest-900 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-forest-600 shrink-0" />
                  Performance credited toward your master Career Readiness score.
                </span>
                <span className="badge-forest text-[10px] py-0.5">Updated</span>
              </div>
            </div>

            {/* Executive Engineering Director Feedback Narrative */}
            <div className="card-premium p-6 sm:p-8 bg-white border border-cream-300 shadow-premium space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-cream-200">
                <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4 text-forest-700" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-navy-950">Principal Staff Engineer & Hiring Manager Assessment</h2>
                  <p className="text-[11px] text-navy-800/60">Synthesized through Groq AI based on your answers and depth</p>
                </div>
              </div>

              <div className="text-sm text-navy-900 leading-relaxed font-normal whitespace-pre-wrap">
                {session.summary_feedback}
              </div>
            </div>

            {/* Key Strengths & High Priority Gaps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths Card */}
              <div className="card-premium p-6 bg-forest-50/40 border border-forest-200 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-forest-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-forest-900">
                    Demonstrated Strengths
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-forest-950">
                  {(session.key_strengths && session.key_strengths.length > 0 ? session.key_strengths : [
                    "Demonstrated core foundational concepts and terminology",
                    "Clear verbal communication on the initial scenario"
                  ]).map((st, i) => (
                    <li key={i} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-forest-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 shrink-0" />
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Where to Improve Card */}
              <div className="card-premium p-6 bg-amber-50/40 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Where You Need to Improve
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-amber-950">
                  {(session.key_improvements && session.key_improvements.length > 0 ? session.key_improvements : [
                    "Elaborate on production failure modes, rollback mechanisms, and telemetry",
                    "Quantify trade-offs (e.g. latency, memory footprint, concurrency) rather than binary statements"
                  ]).map((imp, i) => (
                    <li key={i} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                      <ArrowRight className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Experienced Mentor Roadmap & Suggestions */}
            {session.mentor_advice && (
              <div className="card-premium p-6 sm:p-8 bg-gradient-to-br from-forest-900 to-navy-950 text-white shadow-premium space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-forest-800 text-forest-300 flex items-center justify-center">
                    <Compass className="w-4 h-4 text-forest-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Experienced Veteran Advice: What to Build & Study Next</h3>
                    <p className="text-[11px] text-white/60">Actionable guidance from an experienced Staff Engineer in {session.target_role}</p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal whitespace-pre-wrap">
                  {session.mentor_advice}
                </div>
              </div>
            )}

            {/* Accordion / List of Question-by-Question Answers */}
            <div className="card-premium p-6 bg-white border border-cream-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-forest-700" /> Detailed Question Drill Review
              </h3>

              <div className="space-y-3">
                {session.questions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-cream-50/60 border border-cream-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-navy-950">
                      <span>Question {idx + 1}: {q.topic}</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        (q.score || 0) >= 7 ? 'bg-forest-100 text-forest-800' :
                        (q.score || 0) >= 4 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Score: {q.score || 0} / 10
                      </span>
                    </div>
                    <p className="text-navy-900 font-medium">{q.question_text}</p>
                    <div className="p-3 bg-white rounded-lg border border-cream-200 text-navy-800">
                      <span className="font-bold text-[10px] uppercase text-navy-800/60 block mb-0.5">Your Spoken/Written Answer:</span>
                      <p className="italic">{q.user_answer || 'No response recorded'}</p>
                    </div>
                    {q.feedback && (
                      <p className="text-navy-800/80"><strong className="text-navy-950">Panel Critique:</strong> {q.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-cream-200">
              <button
                onClick={handleFinishOrReset}
                className="btn-outline text-xs py-2.5 px-5 font-bold w-full sm:w-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Practice Another Drill
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/mentor"
                  className="btn-primary text-xs py-2.5 px-5 font-bold flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <Compass className="w-4 h-4 text-forest-300" /> Discuss Gaps with PulseMentor
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Active Question Step */
          <div className="space-y-6">
            {/* Progress Counter */}
            <div className="flex items-center justify-between text-xs font-semibold text-navy-800/70">
              <span>Question {session.current_index + 1} of {session.questions.length}</span>
              <span className="badge-forest">{currentQ.topic}</span>
            </div>

            <div className="w-full h-2 rounded-full bg-cream-200 overflow-hidden">
              <div
                className="h-full bg-forest-600 rounded-full transition-all duration-300"
                style={{ width: `${((session.current_index + (isAnswered ? 1 : 0)) / session.questions.length) * 100}%` }}
              />
            </div>

            {/* Question Card with Text-To-Speech */}
            <div className="card-premium p-6 sm:p-8 bg-white border border-cream-300/80 shadow-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded inline-block">
                  Live Scenario Question
                </span>

                {speechSynthesisSupported && (
                  <button
                    type="button"
                    onClick={() => toggleSpeakQuestion(currentQ.question_text)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isSpeakingQuestion 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' 
                        : 'bg-cream-100 hover:bg-cream-200 text-navy-800 border border-cream-300'
                    }`}
                    title={isSpeakingQuestion ? 'Stop reading' : 'Read question aloud'}
                  >
                    {isSpeakingQuestion ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-amber-700" />
                        <span>Stop Audio</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-forest-700" />
                        <span>🔊 Read Aloud</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-navy-950 leading-relaxed">
                {currentQ.question_text}
              </h2>
            </div>

            {/* Answer Input or Feedback View */}
            {!isAnswered ? (
              <form onSubmit={handleSubmitAnswer} className="card-premium p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy-900">
                      Your Spoken / Written Response
                    </label>
                    {isListening && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold animate-pulse">
                        <Radio className="w-3.5 h-3.5 text-red-600 animate-spin" />
                        Mic Open & Listening...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    {speechSupported && (
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          isListening
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse ring-2 ring-red-400'
                            : 'bg-forest-800 hover:bg-forest-900 text-white'
                        }`}
                        title={isListening ? 'Click to stop dictation and review text' : 'Click to start continuous microphone dictation'}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-3.5 h-3.5" />
                            <span>Done Speaking (Verify Text)</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-forest-300" />
                            <span>🎙️ Speak Answer (Mic)</span>
                          </>
                        )}
                      </button>
                    )}

                    <span className="text-[11px] text-navy-800/50">
                      {currentAnswer.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                </div>

                {/* Persistent Dictation Helper Alert */}
                {micStatusMessage && (
                  <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isListening 
                      ? 'bg-red-50 text-red-800 border border-red-200' 
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {isListening ? (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{micStatusMessage}</span>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    rows={6}
                    required
                    placeholder={
                      isListening
                        ? "🎙️ Microphone is active... Speak your technical explanation at your own pace. You can pause anytime. When finished, click 'Done Speaking' to verify and edit your text."
                        : "Click '🎙️ Speak Answer' to talk into your microphone or type your response here. You can speak, pause, verify the text, and edit before submitting..."
                    }
                    value={currentAnswer}
                    onChange={(e) => {
                      setCurrentAnswer(e.target.value);
                      accumulatedTextRef.current = e.target.value;
                    }}
                    className={`w-full p-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 leading-relaxed transition-all ${
                      isListening 
                        ? 'bg-red-50/20 border-2 border-red-400 focus:bg-white ring-2 ring-red-200' 
                        : 'bg-cream-50/50 border border-cream-200 focus:bg-white'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-navy-800/60 hidden sm:inline">
                    💡 Tip: Review your transcribed words above. Gibberish or mic noise receives 0 marks.
                  </span>
                  <button
                    type="submit"
                    disabled={submitting || !currentAnswer.trim()}
                    className="btn-primary text-xs py-2.5 px-5 font-bold ml-auto"
                  >
                    {submitting ? (
                      <Sparkles className="w-4 h-4 animate-spin text-forest-300" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {submitting ? 'Evaluating with Groq AI...' : 'Submit Answer'}
                  </button>
                </div>
              </form>
            ) : (
              /* Instant AI Feedback Card */
              <div className={`card-premium p-6 sm:p-8 space-y-6 ${
                isFlagged 
                  ? 'border-red-300 bg-red-50/20' 
                  : 'border-forest-200 bg-gradient-to-br from-white to-forest-50/20'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-cream-200">
                  <div className="flex items-center gap-2.5">
                    {isFlagged ? (
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-forest-700" />
                    )}
                    <h3 className="font-bold text-navy-950 text-base">
                      {isFlagged ? 'AI Evaluation — Response Rejected' : 'Groq AI Rubric Evaluation'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-navy-800/60">Rating:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                      currentQ.score >= 8 
                        ? 'bg-forest-100 text-forest-800 border-forest-300' 
                        : currentQ.score >= 5 
                        ? 'bg-amber-100 text-amber-800 border-amber-300' 
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}>
                      {currentQ.score} / 10 {isFlagged ? '• Failed' : ''}
                    </span>
                  </div>
                </div>

                {/* Flagged Alert Banner if Gibberish */}
                {isFlagged && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>
                      Zero marks awarded. Your response does not discuss the technical subject or was flagged as gibberish/off-topic.
                    </span>
                  </div>
                )}

                <p className="text-sm text-navy-900 leading-relaxed font-medium">
                  {currentQ.feedback}
                </p>

                {/* Strengths & Improvements Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-forest-50 border border-forest-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-forest-800 mb-2">
                      Key Strengths
                    </h4>
                    {currentQ.strengths && currentQ.strengths.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-forest-900">
                        {currentQ.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-navy-800/50 italic">None identified for this response.</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
                      Areas to Sharpen
                    </h4>
                    <ul className="space-y-1.5 text-xs text-amber-900">
                      {currentQ.improvements?.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Collapsible Model Answer */}
                {currentQ.ideal_answer && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowIdealAnswer(!showIdealAnswer)}
                      className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1.5"
                    >
                      {showIdealAnswer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showIdealAnswer ? 'Hide Sample Model Answer' : 'Study Sample Model Answer'}
                    </button>

                    {showIdealAnswer && (
                      <div className="mt-3 p-4 rounded-xl bg-cream-50 border border-cream-200 text-xs text-navy-900 leading-relaxed">
                        {currentQ.ideal_answer}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-cream-200">
                  <span className="text-xs text-navy-800/60 font-semibold">
                    Question {session.current_index + 1} of {session.questions.length} evaluated
                  </span>
                  <button
                    onClick={handleNextQuestion}
                    className="btn-primary text-xs py-2 px-5 font-bold"
                  >
                    {session.current_index < session.questions.length - 1 ? (
                      <>Next Question <ArrowRight className="w-4 h-4 ml-1" /></>
                    ) : (
                      <>View Final Evaluation Debrief <Award className="w-4 h-4 ml-1" /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Interview Setup Screen
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-cream-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold mb-2">
            <BrainCircuit className="w-3.5 h-3.5" /> AI Interview Simulator
          </div>
          <h1 className="text-3xl font-extrabold text-navy-950 tracking-tight">
            Role-Specific Mock Interviews
          </h1>
          <p className="text-sm text-navy-800/70 mt-1">
            Simulate real technical and behavioral rounds with persistent voice speech recognition, strict Groq AI grading, and model answers.
          </p>
        </div>

        {/* Live Backend AI Status Badge */}
        <div className="flex items-center gap-2">
          {aiStatus.groq_configured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" /> Groq AI Evaluator Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 shadow-sm" title="Configure GROQ_API_KEY in server/.env line 21">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Groq Key Missing in server/.env
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Setup Card */}
        <div className="lg:col-span-2 card-premium">
          <h2 className="text-lg font-bold text-navy-950 mb-4 pb-3 border-b border-cream-200/80">
            Configure Interview Session
          </h2>

          <form onSubmit={handleStartInterview} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                Target Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="Full-Stack Developer">Full-Stack Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Mobile Developer">Mobile Developer</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                  Interview Type
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-500"
                >
                  <option value="technical">Technical Architecture & Coding</option>
                  <option value="behavioral">Behavioral (STAR Method)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                  Seniority Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-500"
                >
                  <option value="entry_level">Entry Level (College Grad)</option>
                  <option value="mid_level">Mid Level (1-3 yrs)</option>
                  <option value="senior">Senior Level</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                Questions per Drill
              </label>
              <div className="flex gap-4">
                {[2, 3, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      questionCount === cnt
                        ? 'bg-forest-900 text-white border-forest-950 shadow-sm'
                        : 'bg-white text-navy-900 border-cream-300 hover:border-forest-500'
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-cream-200/80">
              <button
                type="submit"
                disabled={starting}
                className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
              >
                {starting ? (
                  <Sparkles className="w-4 h-4 animate-spin text-forest-300" />
                ) : (
                  <BrainCircuit className="w-4 h-4 text-forest-300" />
                )}
                {starting ? 'Generating Interview Session...' : 'Launch Live Mock Interview'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info & History */}
        <div className="space-y-6">
          <div className="card-premium p-5 bg-gradient-to-br from-forest-50/60 to-white border-forest-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest-800 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-forest-600" /> Interview Pro Tips
            </h3>
            <ul className="space-y-2 text-xs text-navy-800 leading-relaxed">
              <li>• <strong>Speak Continuously:</strong> The microphone stays open while you speak. Click 'Done Speaking' to verify your converted text.</li>
              <li>• <strong>Review Before Submitting:</strong> You can edit or add to your answer with keyboard anytime before hitting Submit.</li>
              <li>• <strong>Strict Evaluation:</strong> Nonsensical speech or off-topic words strictly receives 0 marks.</li>
              <li>• <strong>End-of-Round Debrief:</strong> Groq AI analyzes all your answers and suggests exact growth areas.</li>
            </ul>
          </div>

          <div className="card-premium p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3">
              Past Practice History
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-navy-800/50 italic">No interview sessions recorded yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {history.slice(0, 4).map((h) => (
                  <div key={h.id} className="p-3 rounded-xl bg-white border border-cream-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-navy-950 mb-1">
                      <span>{h.target_role}</span>
                      <span className="text-forest-700 font-extrabold">{h.overall_score || 0}/100</span>
                    </div>
                    <p className="text-[11px] text-navy-800/60 capitalize">
                      {h.interview_type} • {h.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};