import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  Sparkles, 
  Target, 
  Code2, 
  FolderGit2, 
  Github, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  Compass
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/overview');
      setData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center animate-spin mb-4 shadow-premium">
          <Sparkles className="w-6 h-6 text-forest-300" />
        </div>
        <p className="text-sm font-semibold text-navy-800">Calculating readiness metrics...</p>
      </div>
    );
  }

  const score = Math.round(data?.readiness_score || 0);

  // Score tier color
  const getScoreColor = (val) => {
    if (val >= 75) return { text: 'text-forest-700', bg: 'bg-forest-50', border: 'border-forest-300', label: 'Interview Ready' };
    if (val >= 45) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', label: 'Developing Competence' };
    return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300', label: 'Foundational Stage' };
  };

  const scoreTier = getScoreColor(score);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-cream-200/80 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Live Career Readiness Telemetry
          </div>
          <h1 className="text-3xl font-extrabold text-navy-950 tracking-tight">
            Student Command Dashboard
          </h1>
          <p className="text-sm text-navy-800/70 mt-1">
            Tracking your progress toward: <span className="font-bold text-forest-800">{data?.target_roles?.join(', ')}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/skill-gap" className="btn-primary text-xs py-2.5">
            <Target className="w-4 h-4" /> Run Skill Gap Analysis
          </Link>
        </div>
      </div>

      {/* Row 1: The Core Readiness Dial & Key Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Readiness Gauge Card */}
        <div className="card-premium lg:col-span-1 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white to-cream-50/50">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-800/70">Career Readiness</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${scoreTier.bg} ${scoreTier.text} ${scoreTier.border}`}>
                {scoreTier.label}
              </span>
            </div>

            {/* Circular Display */}
            <div className="my-6 flex flex-col items-center justify-center text-center">
              <div className="relative w-40 h-40 rounded-full border-8 border-cream-200 flex items-center justify-center shadow-inner bg-white">
                <div 
                  className="absolute inset-0 rounded-full border-8 border-forest-600 border-t-transparent transition-all duration-1000"
                  style={{ transform: `rotate(${(score / 100) * 360}deg)` }}
                />
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-black text-navy-950 tracking-tighter">{score}%</span>
                  <span className="text-[11px] font-bold uppercase text-navy-800/50 mt-0.5">Benchmark</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-navy-800/75 text-center leading-relaxed px-4">
              {data?.latest_analysis?.ai_summary || "Complete your profile skills and project portfolio to boost readiness."}
            </p>
          </div>

          <div className="pt-4 mt-6 border-t border-cream-200/80 flex items-center justify-between text-xs">
            <span className="text-navy-800/60 font-medium">Target Threshold: 80%</span>
            <Link to="/action-plan" className="font-bold text-forest-700 hover:underline flex items-center gap-1">
              View Sprints <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Quick Stat Tiles */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tile 1: Skills Count */}
          <div className="card-premium p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-200 text-forest-700 flex items-center justify-center shrink-0">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-navy-800/60">Verified Skills</p>
              <h3 className="text-2xl font-black text-navy-950 mt-0.5">{data?.skills_count || 0}</h3>
              <Link to="/profile" className="text-xs font-semibold text-forest-700 hover:underline mt-1 inline-block">
                Manage skills →
              </Link>
            </div>
          </div>

          {/* Tile 2: Projects Built */}
          <div className="card-premium p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-200 text-forest-700 flex items-center justify-center shrink-0">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-navy-800/60">Portfolio Projects</p>
              <h3 className="text-2xl font-black text-navy-950 mt-0.5">{data?.projects_count || 0}</h3>
              <p className="text-xs text-navy-800/60 mt-1">
                {data?.projects_count > 0 ? '+15% readiness bonus' : 'Add 1 project for bonus'}
              </p>
            </div>
          </div>

          {/* Tile 3: GitHub Connected */}
          <div className="card-premium p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
              data?.github_connected 
                ? 'bg-forest-50 border-forest-200 text-forest-700' 
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <Github className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-navy-800/60">GitHub Sync</p>
              <h3 className="text-sm font-bold text-navy-950 mt-0.5">
                {data?.github_connected ? 'Connected & Verified' : 'Not Connected'}
              </h3>
              <Link to="/profile" className="text-xs font-semibold text-forest-700 hover:underline mt-1 inline-block">
                {data?.github_connected ? 'Re-sync code →' : 'Connect username →'}
              </Link>
            </div>
          </div>

          {/* Tile 4: Missing Skills */}
          <div className="card-premium p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-navy-800/60">Gaps in Target Role</p>
              <h3 className="text-2xl font-black text-navy-950 mt-0.5">
                {data?.latest_analysis?.missing_skills_count || 0} Missing
              </h3>
              <Link to="/skill-gap" className="text-xs font-semibold text-amber-700 hover:underline mt-1 inline-block">
                View missing skills →
              </Link>
            </div>
          </div>

          {/* High-Impact AI Recommendations Card (spans 2 cols) */}
          <div className="card-premium sm:col-span-2 p-5 bg-cream-50/70 border border-cream-200">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Actionable AI Suggestions
              </h4>
            </div>
            <div className="space-y-2">
              {data?.quick_recommendations?.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-navy-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Radar Chart & AI Skill Gap Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Competency Radar */}
        <div className="card-premium">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-cream-200/80">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-forest-700" />
              <h2 className="text-lg font-bold text-navy-950">Competency Radar</h2>
            </div>
            <span className="text-xs font-semibold text-navy-800/50">Across 5 Pillars</span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data?.radar_data || []}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis 
                  dataKey="domain" 
                  tick={{ fill: '#1E293B', fontSize: 12, fontWeight: 600 }} 
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" />
                <Radar
                  name="Proficiency"
                  dataKey="score"
                  stroke="#059669"
                  fill="#10B981"
                  fillOpacity={0.45}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-center text-navy-800/60 mt-2">
            Higher coverage across the polygon indicates well-rounded full-stack readiness.
          </p>
        </div>

        {/* Target Role Breakdown Snippet */}
        <div className="card-premium flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-cream-200/80">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-forest-700" />
                <h2 className="text-lg font-bold text-navy-950">Active Role Alignment</h2>
              </div>
              <span className="badge-forest">
                {data?.latest_analysis?.target_role || "Full-Stack Developer"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-navy-900">Core Skill Match</span>
                  <span className="text-forest-800">
                    {data?.latest_analysis?.matched_skills_count || 0} / {(data?.latest_analysis?.matched_skills_count || 0) + (data?.latest_analysis?.missing_skills_count || 0)} Required
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-cream-200 overflow-hidden">
                  <div 
                    className="h-full bg-forest-600 rounded-full transition-all duration-700"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-800 mb-2">
                  Immediate Priority Actions:
                </h4>
                <div className="space-y-2">
                  {data?.latest_analysis?.priority_action_items?.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-cream-50/80 border border-cream-200/80 text-xs text-navy-900">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-cream-200 flex items-center justify-between">
            <span className="text-xs text-navy-800/60 font-medium">Want full gap breakdown?</span>
            <Link to="/skill-gap" className="btn-secondary text-xs py-2 px-3.5">
              Open Skill Gap Analyzer →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
