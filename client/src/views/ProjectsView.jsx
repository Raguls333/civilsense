import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatLakhCrore, formatINR, formatDate, formatPercent } from '../utils/formatters';
import { getTranslation } from '../utils/i18n';
import { 
  Building2, 
  Plus, 
  Calendar, 
  MapPin, 
  User, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Phone,
  Settings
} from 'lucide-react';
import { ProjectSettingsModal } from '../components/ProjectSettingsModal';

export const ProjectsView = ({ onSelectProject, onOpenCreateProject, onOpenClientPortal }) => {
  const { token, user, lang } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);

  const fetchProjects = () => {
    setLoading(true);
    fetch('/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchProjects();
  }, [token]);

  return (
    <div className="space-y-4 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {getTranslation(lang, 'projects')}
          </h1>
          <p className="text-xs text-slate-400">
            {user?.role === 'Owner' 
              ? 'Multi-project overview, live budget variance & site progress' 
              : `Assigned site projects for ${user?.name}`}
          </p>
        </div>

        {(user?.role === 'Owner' || user?.role === 'Accountant') && (
          <button
            onClick={onOpenCreateProject}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-300 font-semibold">No active projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {projects.map(proj => {
            const isOverBudget = (proj.liveCost || 0) > (proj.budget || 0);
            const budgetUsedPct = proj.budget > 0 ? Math.min(100, Math.round(((proj.liveCost || 0) / proj.budget) * 100)) : 0;

            return (
              <div
                key={proj.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden group"
              >
                {/* Top Row: Code & Completion % */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 uppercase">
                      {proj.code || 'PRJ'}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1 group-hover:text-amber-300 transition-colors leading-snug">
                      {proj.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <span>Client: <strong className="text-slate-200">{proj.client}</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-amber-400 tracking-tight font-mono">
                      {proj.completionPercentage}%
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Completed</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3.5">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                    style={{ width: `${proj.completionPercentage}%` }}
                  />
                </div>

                {/* Financial Summary: Budget vs Live Cost */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Budget</span>
                    <span className="font-extrabold text-white text-sm">
                      {formatLakhCrore(proj.budget)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">({formatINR(proj.budget)})</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Live Spent Cost</span>
                    <span className={`font-extrabold text-sm ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatLakhCrore(proj.liveCost || proj.spentCost)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {budgetUsedPct}% utilized
                    </span>
                  </div>
                </div>

                {/* Site details */}
                <div className="space-y-1 text-xs text-slate-400 mb-4">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{proj.address || 'Address not configured'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>PM: <strong className="text-slate-300">{proj.supervisorName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>End: {formatDate(proj.targetDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenClientPortal(proj.shareToken)}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold py-1 px-2 rounded-lg hover:bg-amber-400/10 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Client Link</span>
                    </button>

                    {(user?.role === 'Owner' || user?.role === 'Accountant') && (
                      <button
                        onClick={() => setEditingProject(proj)}
                        className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        title="Project Settings, Supervisor Assignee & Milestones"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectProject(proj.id)}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl transition-all"
                  >
                    <span>Manage Site</span>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Settings & Custom Milestones Modal */}
      <ProjectSettingsModal
        isOpen={Boolean(editingProject)}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onProjectUpdated={() => {
          fetchProjects();
        }}
      />
    </div>
  );
};
