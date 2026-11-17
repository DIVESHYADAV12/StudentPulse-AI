import React, { useState, useEffect } from 'react';
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
  MessageSquare
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

  useEffect(() => {
    fetchHistory();
  }, []);

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
    setCurrentAnswer('');
    setShowIdealAnswer(false);
  };

  const handleFinishOrReset = () => {
    setSession(null);
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
              <p className="text-xs text-navy-800/60 uppercase font-semibold tracking-wider">
                {session.interview_type} • {session.difficulty.replace('_', ' ')}
              </p>
            </div>
          </div>

          <button
            onClick={handleFinishOrReset}
            className="btn-outline text-xs py-1.5 px-3"
          >
            Exit Session
          </button>
        </div>

        {/* If Completed Summary View */}
        {isCompleted ? (
          <div className="card-premium text-center p-8 bg-gradient-to-br from-white to-cream-50 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-forest-100 text-forest-800 border border-forest-200 flex items-center justify-center mx-auto shadow-sm">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Interview Completed</span>
              <h1 className="text-4xl font-black text-navy-950 mt-1">
                Score: {session.overall_score} / 100
              </h1>
              <p className="text-sm text-navy-800/80 max-w-lg mx-auto mt-3 leading-relaxed">
                {session.summary_feedback}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-forest-50 border border-forest-200 text-xs font-semibold text-forest-900 inline-block">
              🎉 Your master Career Readiness score has been updated with interview credit!
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={handleFinishOrReset}
                className="btn-primary text-xs py-2.5 px-5 font-bold"
              >
                Back to Dashboard
              </button>
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

            {/* Question Card */}
            <div className="card-premium p-6 sm:p-8 bg-white border border-cream-300/80 shadow-premium">
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded inline-block mb-3">
                Live Scenario Question
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-navy-950 leading-relaxed">
                {currentQ.question_text}
              </h2>
            </div>

            {/* Answer Input or Feedback View */}
            {!isAnswered ? (
              <form onSubmit={handleSubmitAnswer} className="card-premium p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy-900">
                    Your Response
                  </label>
                  <span className="text-[11px] text-navy-800/50">
                    {currentAnswer.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                <textarea
                  rows={6}
                  required
                  placeholder="Type your structured answer here. Include architectural considerations, trade-offs, and how you would handle failure scenarios..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="w-full p-4 bg-cream-50/50 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-navy-800/60 hidden sm:inline">
                    💡 Tip: Structure your response with concrete examples.
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
                    {submitting ? 'Evaluating with AI...' : 'Submit Answer'}
                  </button>
                </div>
              </form>
            ) : (
              /* Instant AI Feedback Card */
              <div className="card-premium p-6 sm:p-8 space-y-6 border-forest-200 bg-gradient-to-br from-white to-forest-50/20">
                <div className="flex items-center justify-between pb-4 border-b border-cream-200">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-forest-700" />
                    <h3 className="font-bold text-navy-950 text-base">AI Evaluation & Rubric Feedback</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-navy-800/60">Rating:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                      currentQ.score >= 8 
                        ? 'bg-forest-100 text-forest-800 border-forest-300' 
                        : currentQ.score >= 6 
                        ? 'bg-amber-100 text-amber-800 border-amber-300' 
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {currentQ.score} / 10
                    </span>
                  </div>
                </div>

                <p className="text-sm text-navy-900 leading-relaxed font-medium">
                  {currentQ.feedback}
                </p>

                {/* Strengths & Improvements Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-forest-50 border border-forest-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-forest-800 mb-2">
                      Key Strengths
                    </h4>
                    <ul className="space-y-1.5 text-xs text-forest-900">
                      {currentQ.strengths?.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
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

                <div className="flex justify-end pt-4 border-t border-cream-200">
                  <button
                    onClick={handleNextQuestion}
                    className="btn-primary text-xs py-2 px-5 font-bold"
                  >
                    Next Question <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Interview Setup & History Screen
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-cream-200/80">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold mb-2">
          <BrainCircuit className="w-3.5 h-3.5" /> AI Interview Simulator
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950 tracking-tight">
          Role-Specific Mock Interviews
        </h1>
        <p className="text-sm text-navy-800/70 mt-1">
          Simulate real-world technical and behavioral rounds with instant scoring, feedback, and sample model answers.
        </p>
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
                Target Job Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
              >
                <option value="Full-Stack Developer">Full-Stack Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="AI / ML Engineer">AI / ML Engineer</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                  Interview Mode
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
                >
                  <option value="technical">Technical & System Q&A</option>
                  <option value="behavioral">Behavioral (STAR Method)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                  Question Count
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
                >
                  <option value={2}>2 Questions (Fast Practice)</option>
                  <option value={3}>3 Questions (Standard)</option>
                  <option value={5}>5 Questions (Comprehensive)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                Experience Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDifficulty('entry_level')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    difficulty === 'entry_level'
                      ? 'bg-forest-50 border-forest-600 text-forest-900 shadow-sm'
                      : 'bg-white border-cream-200 text-navy-800/70 hover:bg-cream-50'
                  }`}
                >
                  <p className="text-xs font-bold">Entry-Level / Intern</p>
                  <p className="text-[11px] opacity-75">Core fundamentals & code syntax</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDifficulty('mid_level')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    difficulty === 'mid_level'
                      ? 'bg-forest-50 border-forest-600 text-forest-900 shadow-sm'
                      : 'bg-white border-cream-200 text-navy-800/70 hover:bg-cream-50'
                  }`}
                >
                  <p className="text-xs font-bold">Associate / Mid-Level</p>
                  <p className="text-[11px] opacity-75">Architecture & edge cases</p>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={starting}
              className="w-full btn-primary py-3 font-bold text-sm mt-3"
            >
              <BrainCircuit className="w-4 h-4 mr-1" />
              {starting ? 'Starting Simulation...' : 'Launch Interview Session'}
            </button>
          </form>
        </div>

        {/* History / Tips Column */}
        <div className="space-y-6">
          <div className="card-premium p-5 bg-cream-50/70 border border-cream-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-forest-700" />
              Interview Tips
            </h3>
            <ul className="space-y-2 text-xs text-navy-800 leading-relaxed">
              <li>• Structure technical answers: Concept → Why it matters → Trade-offs.</li>
              <li>• For behavioral prompts, structure responses with the <strong>STAR method</strong> (Situation, Task, Action, Result).</li>
              <li>• Scoring higher in practice rounds actively boosts your overall Career Readiness score.</li>
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
