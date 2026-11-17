import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Target, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Lightbulb, 
  FolderGit2, 
  BookOpen,
  Award
} from 'lucide-react';

export const SkillGap = () => {
  const [benchmarks, setBenchmarks] = useState([]);
  const [selectedRole, setSelectedRole] = useState('Full-Stack Developer');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [benchRes, latestRes] = await Promise.all([
        api.get('/skill-gap/benchmarks'),
        api.get('/skill-gap/latest')
      ]);

      setBenchmarks(benchRes.data);
      if (latestRes.data) {
        setAnalysis(latestRes.data);
        setSelectedRole(latestRes.data.target_role);
      } else if (benchRes.data.length > 0) {
        setSelectedRole(benchRes.data[0].role_title);
      }
    } catch (err) {
      console.error("Failed to load skill gap data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async (roleToAnalyze) => {
    const role = roleToAnalyze || selectedRole;
    try {
      setAnalyzing(true);
      const res = await api.post('/skill-gap/analyze', { target_role: role });
      setAnalysis(res.data);
      setSelectedRole(role);
    } catch (err) {
      console.error("Failed to analyze skill gap", err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center animate-spin mb-4 shadow-premium">
          <Sparkles className="w-6 h-6 text-forest-300" />
        </div>
        <p className="text-sm font-semibold text-navy-800">Loading industry benchmarks...</p>
      </div>
    );
  }

  const matchedSkills = analysis?.analyzed_skills?.filter(s => s.status !== 'missing') || [];
  const missingSkills = analysis?.analyzed_skills?.filter(s => s.status === 'missing') || [];
  const score = Math.round(analysis?.readiness_percentage || 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-cream-200/80 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold mb-2">
            <Target className="w-3.5 h-3.5" /> Industry Benchmarking Engine
          </div>
          <h1 className="text-3xl font-extrabold text-navy-950 tracking-tight">
            AI Skill Gap Analyzer
          </h1>
          <p className="text-sm text-navy-800/70 mt-1">
            Compare your profile against actual job requirements to identify missing skills and improvement paths.
          </p>
        </div>

        {/* Role Selector Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              handleRunAnalysis(e.target.value);
            }}
            className="px-4 py-2.5 bg-white border border-cream-300 rounded-xl text-sm font-semibold text-navy-950 focus:outline-none focus:ring-2 focus:ring-forest-500 shadow-sm"
          >
            {benchmarks.map((b) => (
              <option key={b.id} value={b.role_title}>
                {b.role_title}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleRunAnalysis(selectedRole)}
            disabled={analyzing}
            className="btn-primary text-xs py-2.5 px-4"
          >
            {analyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-forest-300" />
            )}
            {analyzing ? 'Evaluating...' : 'Re-Analyze Skills'}
          </button>
        </div>
      </div>

      {/* Hero Summary Card */}
      <div className="card-premium bg-gradient-to-br from-white to-cream-50/60 p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          {/* Readiness Percentage Meter */}
          <div className="lg:col-span-1 text-center lg:text-left flex flex-col items-center lg:items-start border-b lg:border-b-0 lg:border-r border-cream-200/80 pb-6 lg:pb-0 lg:pr-6">
            <span className="text-xs font-bold uppercase tracking-wider text-navy-800/60 mb-2">
              Role Match Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-forest-800">{score}%</span>
              <span className="text-xs font-bold text-navy-800/50">/ 100</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-forest-100 text-forest-800 border border-forest-200">
                {matchedSkills.length} Matched
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {missingSkills.length} Gaps
              </span>
            </div>
          </div>

          {/* AI Narrative & Summary */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center gap-2 text-forest-700">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">AI Hiring Manager Assessment</h3>
            </div>
            <p className="text-sm text-navy-900 leading-relaxed font-medium">
              {analysis?.ai_summary}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {analysis?.priority_action_items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-navy-800 bg-white px-3 py-1 rounded-lg border border-cream-200 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Breakdown: Matched vs Missing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Matched & In-Progress Skills */}
        <div className="card-premium">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-cream-200/80">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-forest-700" />
              <h2 className="text-lg font-bold text-navy-950">
                Matched Competencies ({matchedSkills.length})
              </h2>
            </div>
            <span className="text-xs font-semibold text-forest-700">Ready in Profile</span>
          </div>

          {matchedSkills.length === 0 ? (
            <div className="text-center py-10 bg-cream-50/50 rounded-2xl border border-dashed border-cream-300">
              <AlertCircle className="w-8 h-8 text-navy-800/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-navy-900">No matching skills yet</p>
              <p className="text-xs text-navy-800/60 mt-1">Add core {selectedRole} skills in your Profile to match requirements.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchedSkills.map((skill) => (
                <div
                  key={skill.name}
                  className="p-4 rounded-xl bg-forest-50/40 border border-forest-200/70 flex flex-col justify-between transition-all hover:bg-forest-50/70"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-navy-950 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-forest-500" />
                      {skill.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800 border border-forest-200">
                        {skill.proficiency || 'intermediate'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-navy-800/70 leading-relaxed">
                    {skill.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Missing Skills & High-Priority Gaps */}
        <div className="card-premium">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-cream-200/80">
            <div className="flex items-center gap-2.5">
              <XCircle className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-navy-950">
                Identified Skill Gaps ({missingSkills.length})
              </h2>
            </div>
            <span className="text-xs font-semibold text-amber-700">Recommended to Learn</span>
          </div>

          {missingSkills.length === 0 ? (
            <div className="text-center py-10 bg-forest-50/50 rounded-2xl border border-forest-200">
              <Award className="w-10 h-10 text-forest-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-forest-900">All Core Skills Covered!</p>
              <p className="text-xs text-forest-800/70 mt-1">You have all canonical skills for this role in your profile.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {missingSkills.map((skill) => (
                <div
                  key={skill.name}
                  className="p-4 rounded-xl bg-white border border-amber-200 hover:border-amber-400 transition-all shadow-soft"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-navy-950 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {skill.name}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      skill.importance === 'critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {skill.importance}
                    </span>
                  </div>
                  <p className="text-xs text-navy-800/75 leading-relaxed">
                    {skill.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Projects to Bridge Gaps */}
      <div className="card-premium">
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-cream-200/80">
          <FolderGit2 className="w-5 h-5 text-forest-700" />
          <div>
            <h2 className="text-lg font-bold text-navy-950">Curated Capstone Project Recommendations</h2>
            <p className="text-xs text-navy-800/70">
              Building these projects directly proves your proficiency in your missing skills.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis?.recommended_project_ideas?.map((idea, index) => (
            <div
              key={index}
              className="p-5 rounded-2xl bg-cream-50/70 border border-cream-200/80 hover:border-forest-300 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-forest-800 border border-cream-200 inline-block mb-3">
                  Recommended Project #{index + 1}
                </span>
                <h3 className="text-sm font-bold text-navy-950 leading-snug mb-2">
                  {idea}
                </h3>
              </div>
              <div className="pt-3 mt-4 border-t border-cream-200/80 flex items-center justify-between text-xs">
                <span className="text-forest-700 font-semibold">Targets Missing Skills</span>
                <ArrowRight className="w-4 h-4 text-forest-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
