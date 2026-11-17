import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import confetti from 'canvas-confetti';
import { 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Clock, 
  RefreshCw, 
  BookOpen, 
  Code2, 
  FolderGit2, 
  BrainCircuit,
  Award,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const ActionPlan = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [openWeeks, setOpenWeeks] = useState({ 1: true, 2: true, 3: false, 4: false });

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await api.get('/action-plan/current');
      setPlan(res.data);
    } catch (err) {
      console.error("Failed to load action plan", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      setTogglingId(taskId);
      const res = await api.patch(`/action-plan/tasks/${taskId}`, {
        is_completed: !currentStatus
      });
      setPlan(res.data);

      if (!currentStatus) {
        // Trigger celebratory confetti on completing tasks
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err) {
      console.error("Failed to toggle task", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleRegenerate = async () => {
    try {
      setRefreshing(true);
      const res = await api.post('/action-plan/generate');
      setPlan(res.data);
    } catch (err) {
      console.error("Failed to regenerate plan", err);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleWeekAccordion = (weekNum) => {
    setOpenWeeks(prev => ({ ...prev, [weekNum]: !prev[weekNum] }));
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'theory': return <BookOpen className="w-3.5 h-3.5 text-blue-600" />;
      case 'project': return <FolderGit2 className="w-3.5 h-3.5 text-forest-700" />;
      case 'interview': return <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />;
      default: return <Code2 className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center animate-spin mb-4 shadow-premium">
          <Sparkles className="w-6 h-6 text-forest-300" />
        </div>
        <p className="text-sm font-semibold text-navy-800">Generating weekly learning sprints...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-cream-200/80 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-bold mb-2">
            <TrendingUp className="w-3.5 h-3.5" /> Adaptive 4-Week Roadmap
          </div>
          <h1 className="text-3xl font-extrabold text-navy-950 tracking-tight">
            Personalized Action Plan
          </h1>
          <p className="text-sm text-navy-800/70 mt-1">
            Weekly structured goals designed to bridge your skill gaps for <span className="font-bold text-forest-800">{plan?.target_role}</span>.
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={refreshing}
          className="btn-secondary text-xs py-2 px-3.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Re-optimizing...' : 'Re-sync Plan with Gaps'}
        </button>
      </div>

      {/* Sprint Progress Hero Card */}
      <div className="card-premium bg-gradient-to-br from-white to-cream-50/70 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-navy-800/60">
              Sprint Roadmap Progress
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-navy-950">{plan?.completed_tasks}</span>
              <span className="text-sm text-navy-800/60 font-semibold">of {plan?.total_tasks} Tasks Completed</span>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-3xl font-black text-forest-800">{Math.round(plan?.progress_percentage || 0)}%</span>
            <p className="text-xs text-forest-700 font-medium">Readiness Boost Active</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-cream-200 overflow-hidden">
          <div
            className="h-full bg-forest-600 rounded-full transition-all duration-700"
            style={{ width: `${plan?.progress_percentage || 0}%` }}
          />
        </div>
      </div>

      {/* Weekly Sprints Accordion */}
      <div className="space-y-5">
        {plan?.weeks?.map((week) => {
          const isOpen = openWeeks[week.week_number];
          const completedCount = week.tasks.filter(t => t.is_completed).length;
          const isWeekDone = completedCount === week.tasks.length && week.tasks.length > 0;

          return (
            <div
              key={week.week_number}
              className={`card-premium p-0 overflow-hidden border transition-all ${
                isWeekDone ? 'border-forest-300 bg-forest-50/20' : 'border-cream-200/90'
              }`}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleWeekAccordion(week.week_number)}
                className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-cream-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm border shadow-sm ${
                    isWeekDone
                      ? 'bg-forest-600 text-white border-forest-700'
                      : 'bg-white text-navy-900 border-cream-300'
                  }`}>
                    W{week.week_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-navy-950">{week.theme}</h2>
                      {isWeekDone && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-forest-100 text-forest-800 border border-forest-200">
                          Complete
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-navy-800/70 mt-0.5 max-w-xl">{week.goal}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-semibold text-navy-800/60 hidden sm:inline">
                    {completedCount} / {week.tasks.length} done
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-navy-800/40" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-navy-800/40" />
                  )}
                </div>
              </button>

              {/* Tasks List */}
              {isOpen && (
                <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-cream-200/80 space-y-3">
                  {week.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id, task.is_completed)}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-4 cursor-pointer transition-all ${
                        task.is_completed
                          ? 'bg-forest-50/60 border-forest-200 opacity-90'
                          : 'bg-white border-cream-200 hover:border-forest-300 shadow-soft'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <button
                          type="button"
                          className="mt-0.5 text-forest-700 hover:text-forest-900 transition-colors shrink-0"
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="w-5 h-5 fill-forest-600 text-white" />
                          ) : (
                            <Circle className="w-5 h-5 text-navy-800/30" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-bold ${
                              task.is_completed ? 'line-through text-navy-800/60' : 'text-navy-950'
                            }`}>
                              {task.title}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cream-100 text-navy-800 border border-cream-200">
                              {getCategoryIcon(task.category)}
                              {task.category}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-xs text-navy-800/70 mt-1 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[11px] font-bold text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded">
                          +{task.points} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
