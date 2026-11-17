import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, 
  Target, 
  Code2, 
  FolderGit2, 
  Github, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Sparkles,
  Save,
  RefreshCw,
  Star,
  CheckCircle2
} from 'lucide-react';

const POPULAR_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full-Stack Developer",
  "Data Scientist",
  "DevOps Engineer",
  "AI / ML Engineer"
];

const SKILL_CATEGORIES = [
  { id: "languages", label: "Languages" },
  { id: "frameworks", label: "Frameworks / Libs" },
  { id: "databases", label: "Databases" },
  { id: "tools", label: "Tools & DevOps" },
  { id: "core_cs", label: "Core CS Fundamentals" }
];

export const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // GitHub Sync State
  const [githubUsername, setGithubUsername] = useState('');
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [githubData, setGithubData] = useState(null);

  // New Skill Modal State
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'languages',
    proficiency: 'intermediate'
  });

  // New Project Modal State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tech_stack: '',
    github_url: '',
    live_url: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile');
      setProfile(res.data);
      if (res.data.github_username) {
        setGithubUsername(res.data.github_username);
      }
    } catch (err) {
      console.error("Error loading profile", err);
      setMessage({ text: 'Could not load profile data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const persistProfile = async (updatedFields, successMessage) => {
    try {
      setSaving(true);
      const payload = {
        education: updatedFields.education !== undefined ? updatedFields.education : profile.education,
        skills: updatedFields.skills !== undefined ? updatedFields.skills : profile.skills,
        target_roles: updatedFields.target_roles !== undefined ? updatedFields.target_roles : profile.target_roles,
        github_username: updatedFields.github_username !== undefined ? updatedFields.github_username : githubUsername
      };

      const res = await api.put('/profile', payload);
      setProfile(res.data);
      if (successMessage) {
        setMessage({ text: successMessage, type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      }
      return res.data;
    } catch (err) {
      console.error("Error saving profile", err);
      setMessage({ text: 'Failed to save changes.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    await persistProfile({}, 'Profile changes saved successfully! Skill Gap Analysis updated.');
  };

  const handleEducationChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      education: { ...prev.education, [field]: value }
    }));
  };

  const handleRoleToggle = async (role) => {
    const current = profile?.target_roles || [];
    const updated = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];
    const finalRoles = updated.length ? updated : [role];

    setProfile(prev => ({ ...prev, target_roles: finalRoles }));
    await persistProfile({ target_roles: finalRoles });
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;

    const skillName = newSkill.name.trim();
    const exists = profile.skills.some(
      s => s.name.toLowerCase() === skillName.toLowerCase()
    );
    if (exists) {
      setMessage({ text: `"${skillName}" is already in your skills list.`, type: 'error' });
      return;
    }

    const updatedSkills = [
      ...profile.skills,
      {
        name: skillName,
        category: newSkill.category,
        proficiency: newSkill.proficiency
      }
    ];

    setProfile(prev => ({ ...prev, skills: updatedSkills }));
    setNewSkill({ name: '', category: 'languages', proficiency: 'intermediate' });
    setShowSkillModal(false);

    // Auto-save immediately to backend and recalculate gap analysis
    await persistProfile(
      { skills: updatedSkills },
      `Added "${skillName}" to skills! Skill Gap Analysis automatically updated.`
    );
  };

  const handleRemoveSkill = async (skillName) => {
    const updatedSkills = profile.skills.filter(s => s.name !== skillName);
    setProfile(prev => ({ ...prev, skills: updatedSkills }));
    await persistProfile(
      { skills: updatedSkills },
      `Removed "${skillName}". Skill Gap Analysis updated.`
    );
  };

  const handleSyncGithub = async (e) => {
    e.preventDefault();
    if (!githubUsername.trim()) return;

    try {
      setSyncingGithub(true);
      const res = await api.post('/profile/sync-github', {
        username: githubUsername.trim()
      });
      setGithubData(res.data);
      setMessage({ 
        text: `Synced GitHub for @${res.data.username}! Click "Import Detected Skills" to add them to your profile.`, 
        type: 'success' 
      });
    } catch (err) {
      setMessage({
        text: err.response?.data?.detail || 'Could not verify GitHub profile. Check the username.',
        type: 'error'
      });
    } finally {
      setSyncingGithub(false);
    }
  };

  const handleImportGithubSkills = async () => {
    if (!githubData) return;

    // Aggregate detected_skills, top_languages, and repository topics/languages
    const candidateSet = new Set();
    (githubData.detected_skills || []).forEach(s => candidateSet.add(s));
    (githubData.top_languages || []).forEach(l => candidateSet.add(l));
    (githubData.repositories || []).forEach(r => {
      if (r.language) candidateSet.add(r.language);
      (r.topics || []).forEach(t => candidateSet.add(t));
    });

    const existingNames = new Set(profile.skills.map(s => s.name.toLowerCase()));
    const newItems = [];

    const guessCategory = (name) => {
      const n = name.toLowerCase();
      if (['docker', 'kubernetes', 'git', 'linux', 'ci/cd', 'aws', 'gcp', 'terraform', 'actions'].some(x => n.includes(x))) return 'tools';
      if (['sql', 'postgres', 'postgresql', 'mysql', 'mongo', 'mongodb', 'redis', 'prisma'].some(x => n.includes(x))) return 'databases';
      if (['react', 'vue', 'angular', 'fastapi', 'django', 'express', 'node', 'nextjs', 'tailwind', 'flask'].some(x => n.includes(x))) return 'frameworks';
      return 'languages';
    };

    candidateSet.forEach(skillName => {
      if (skillName && typeof skillName === 'string' && !existingNames.has(skillName.toLowerCase())) {
        newItems.push({
          name: skillName,
          category: guessCategory(skillName),
          proficiency: 'intermediate'
        });
      }
    });

    if (newItems.length === 0) {
      setMessage({ text: 'All detected GitHub skills are already added to your profile.', type: 'info' });
      return;
    }

    const updatedSkills = [...profile.skills, ...newItems];
    setProfile(prev => ({ ...prev, skills: updatedSkills }));

    // Auto-save immediately to database
    await persistProfile(
      { skills: updatedSkills, github_username: githubData.username },
      `Successfully imported ${newItems.length} skills from GitHub! Skill Gap Analysis automatically updated.`
    );
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim() || !newProject.description.trim()) return;

    try {
      const techArray = newProject.tech_stack
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await api.post('/profile/projects', {
        title: newProject.title.trim(),
        description: newProject.description.trim(),
        tech_stack: techArray,
        github_url: newProject.github_url.trim() || null,
        live_url: newProject.live_url.trim() || null
      });

      setProfile(res.data);
      setNewProject({ title: '', description: '', tech_stack: '', github_url: '', live_url: '' });
      setShowProjectModal(false);
      setMessage({ text: 'Project added! Readiness score updated with portfolio bonus.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to add project.', type: 'error' });
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const res = await api.delete(`/profile/projects/${projectId}`);
      setProfile(res.data);
      setMessage({ text: 'Project removed.', type: 'info' });
    } catch (err) {
      setMessage({ text: 'Failed to delete project.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center animate-spin mb-4">
          <Sparkles className="w-6 h-6 text-forest-300" />
        </div>
        <p className="text-sm font-semibold text-navy-800">Loading student profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200/80">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-950 tracking-tight flex items-center gap-2.5">
            Student Profile & Background
          </h1>
          <p className="text-sm text-navy-800/70 mt-1">
            Skills and changes are automatically saved and synced with your AI Skill Gap Analyzer.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Notification Toast */}
      {message.text && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
          message.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : message.type === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-forest-50 border-forest-200 text-forest-800'
        }`}>
          {message.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-forest-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Section 1: Academic Information & Target Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Academic Details */}
        <div className="lg:col-span-2 card-premium">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-cream-200/80">
            <GraduationCap className="w-5 h-5 text-forest-700" />
            <h2 className="text-lg font-bold text-navy-950">Academic Education</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                College / University
              </label>
              <input
                type="text"
                value={profile?.education?.university || ''}
                onChange={(e) => handleEducationChange('university', e.target.value)}
                placeholder="e.g. Stanford University / State College"
                className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                Degree / Major
              </label>
              <input
                type="text"
                value={profile?.education?.degree || ''}
                onChange={(e) => handleEducationChange('degree', e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                Expected Graduation Year
              </label>
              <input
                type="number"
                value={profile?.education?.grad_year || 2026}
                onChange={(e) => handleEducationChange('grad_year', parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                CGPA or Percentage
              </label>
              <input
                type="number"
                step="0.01"
                value={profile?.education?.cgpa || ''}
                onChange={(e) => handleEducationChange('cgpa', parseFloat(e.target.value) || null)}
                placeholder="e.g. 3.8 or 8.5"
                className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Target Roles Selector */}
        <div className="card-premium">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-cream-200/80">
            <Target className="w-5 h-5 text-forest-700" />
            <h2 className="text-lg font-bold text-navy-950">Target Roles</h2>
          </div>
          <p className="text-xs text-navy-800/70 mb-4">
            Select the job roles you are aiming for. AI will benchmark your readiness against these industry baselines.
          </p>

          <div className="flex flex-wrap gap-2">
            {POPULAR_ROLES.map((role) => {
              const selected = profile?.target_roles?.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleToggle(role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selected
                      ? 'bg-forest-700 text-white border-forest-800 shadow-sm'
                      : 'bg-cream-50/80 text-navy-800/80 border-cream-300 hover:bg-white'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 inline mr-1" />}
                  {role}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Technical Skills Inventory */}
      <div className="card-premium">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-cream-200/80 gap-3">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-forest-700" />
            <div>
              <h2 className="text-lg font-bold text-navy-950">Technical Skills Inventory</h2>
              <p className="text-xs text-navy-800/70">
                Skills added here are immediately auto-saved and linked to your AI Skill Gap Analyzer.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSkillModal(true)}
            className="btn-primary text-xs py-2 px-3.5"
          >
            <Plus className="w-4 h-4" /> Add Skill
          </button>
        </div>

        {/* Grouped Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SKILL_CATEGORIES.map((cat) => {
            const catSkills = profile?.skills?.filter(s => s.category === cat.id) || [];
            return (
              <div key={cat.id} className="p-4 rounded-xl bg-cream-50/70 border border-cream-200/80">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                    {cat.label} ({catSkills.length})
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {catSkills.length === 0 ? (
                    <span className="text-xs text-navy-800/40 italic">No skills added yet</span>
                  ) : (
                    catSkills.map((skill) => (
                      <span
                        key={skill.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-cream-300/80 text-xs font-medium text-navy-900 shadow-sm"
                      >
                        <span className="font-semibold">{skill.name}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          skill.proficiency === 'advanced'
                            ? 'bg-forest-100 text-forest-800'
                            : skill.proficiency === 'intermediate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {skill.proficiency}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.name)}
                          className="text-navy-800/40 hover:text-red-600 transition-colors ml-1"
                          title="Remove skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: GitHub Integration & Sync */}
      <div className="card-premium">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-cream-200/80 gap-3">
          <div className="flex items-center gap-2.5">
            <Github className="w-5 h-5 text-forest-700" />
            <div>
              <h2 className="text-lg font-bold text-navy-950">GitHub Public Repository Sync</h2>
              <p className="text-xs text-navy-800/70">
                Connect your public GitHub username to analyze code repositories and auto-discover languages.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSyncGithub} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Github className="w-5 h-5 text-navy-800/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="e.g. torvalds or your-github-handle"
              className="w-full pl-11 pr-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={syncingGithub || !githubUsername.trim()}
            className="btn-primary text-xs whitespace-nowrap"
          >
            {syncingGithub ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncingGithub ? 'Syncing...' : 'Sync GitHub'}
          </button>
        </form>

        {/* GitHub Results Card */}
        {githubData && (
          <div className="p-5 rounded-2xl bg-cream-50/80 border border-cream-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {githubData.avatar_url && (
                  <img
                    src={githubData.avatar_url}
                    alt={githubData.username}
                    className="w-12 h-12 rounded-full border border-forest-200 shadow-sm"
                  />
                )}
                <div>
                  <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                    {githubData.name || githubData.username}
                    <span className="text-xs font-normal text-navy-800/60">(@{githubData.username})</span>
                  </h3>
                  <p className="text-xs text-navy-800/70">{githubData.bio || 'Public GitHub profile verified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 bg-white rounded-lg border border-cream-300">
                  {githubData.public_repos} Public Repos
                </span>
                <button
                  type="button"
                  onClick={handleImportGithubSkills}
                  disabled={saving}
                  className="btn-primary text-xs py-2 px-3.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-forest-300" />
                  {saving ? 'Importing...' : 'Import Detected Skills'}
                </button>
              </div>
            </div>

            {/* Detected Languages & Repos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-cream-200">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-navy-800 mb-2">
                  Top Detected Languages:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {githubData.top_languages.map(lang => (
                    <span key={lang} className="px-2.5 py-1 rounded-md bg-white border text-xs font-medium text-navy-900">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-navy-800 mb-2">
                  Recent Active Repositories:
                </p>
                <div className="space-y-1.5">
                  {githubData.repositories.slice(0, 3).map(repo => (
                    <a
                      key={repo.name}
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-cream-200 hover:border-forest-400 text-xs text-navy-900 transition-colors"
                    >
                      <span className="font-semibold text-forest-800 truncate">{repo.name}</span>
                      <div className="flex items-center gap-2 text-navy-800/60 shrink-0">
                        {repo.language && <span>{repo.language}</span>}
                        {repo.stars > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {repo.stars}
                          </span>
                        )}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Projects Portfolio */}
      <div className="card-premium">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-cream-200/80 gap-3">
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-forest-700" />
            <div>
              <h2 className="text-lg font-bold text-navy-950">Projects & Practical Portfolio</h2>
              <p className="text-xs text-navy-800/70">
                Showcase hands-on applications you've built. Projects heavily boost your readiness score.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowProjectModal(true)}
            className="btn-secondary text-xs py-2 px-3.5"
          >
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>

        {profile?.projects?.length === 0 ? (
          <div className="text-center py-10 bg-cream-50/50 rounded-2xl border border-dashed border-cream-300">
            <FolderGit2 className="w-10 h-10 text-navy-800/30 mx-auto mb-2" />
            <p className="text-sm font-semibold text-navy-900">No projects added yet</p>
            <p className="text-xs text-navy-800/60 mt-1">Add your hackathon, college, or side projects to showcase your skills.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile?.projects?.map(project => (
              <div
                key={project.id}
                className="p-5 rounded-2xl bg-white border border-cream-200 hover:border-forest-300 transition-all shadow-soft flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-navy-950 text-base">{project.title}</h3>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-navy-800/40 hover:text-red-600 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-navy-800/75 leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.tech_stack?.map(tech => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded-md bg-forest-50 text-forest-800 text-[11px] font-semibold border border-forest-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-cream-200/80 text-xs">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:underline"
                      >
                        <Github className="w-3.5 h-3.5" /> Code Repo
                      </a>
                    )}
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:text-forest-700 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-cream-200 shadow-premium">
            <h3 className="text-lg font-bold text-navy-950 mb-1">Add Technical Skill</h3>
            <p className="text-xs text-navy-800/70 mb-5">Specify the skill name, category, and your comfort level.</p>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Docker, TypeScript, Redis, SQL"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                  Category
                </label>
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
                >
                  <option value="languages">Languages</option>
                  <option value="frameworks">Frameworks / Libraries</option>
                  <option value="databases">Databases</option>
                  <option value="tools">Tools & DevOps</option>
                  <option value="core_cs">Core CS Fundamentals</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                  Proficiency Level
                </label>
                <select
                  value={newSkill.proficiency}
                  onChange={(e) => setNewSkill({ ...newSkill, proficiency: e.target.value })}
                  className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
                >
                  <option value="beginner">Beginner (Familiar with syntax & basics)</option>
                  <option value="intermediate">Intermediate (Built projects with it)</option>
                  <option value="advanced">Advanced (Deep knowledge & production ready)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setShowSkillModal(false)}
                  className="btn-outline text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs py-2 px-4 font-bold"
                >
                  {saving ? 'Saving...' : 'Add & Save Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-cream-200 shadow-premium">
            <h3 className="text-lg font-bold text-navy-950 mb-1">Add Portfolio Project</h3>
            <p className="text-xs text-navy-800/70 mb-5">Describe a project you worked on and the technologies used.</p>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Task Queue"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                  Description & Impact
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Built an asynchronous task worker with Redis and FastAPI, reducing background processing latency by 40%."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                  Tech Stack (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Python, PostgreSQL, Docker"
                  value={newProject.tech_stack}
                  onChange={(e) => setNewProject({ ...newProject, tech_stack: e.target.value })}
                  className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                    GitHub URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={newProject.github_url}
                    onChange={(e) => setNewProject({ ...newProject, github_url: e.target.value })}
                    className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                    Live Demo Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://myproject.com"
                    value={newProject.live_url}
                    onChange={(e) => setNewProject({ ...newProject, live_url: e.target.value })}
                    className="w-full px-4 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="btn-outline text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-4 font-bold"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
