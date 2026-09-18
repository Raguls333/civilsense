import React, { useState, useEffect } from 'react';
import { formatLakhCrore, formatINR, formatDate } from '../utils/formatters';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Camera, 
  Calendar, 
  HardHat, 
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';

export const PublicClientPortal = ({ token = 'gv-villa-pub-4829', onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/public/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Invalid or expired project public link');
        return res.json();
      })
      .then(resData => {
        setData(resData);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto animate-spin">
            <HardHat className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400">Loading verified site progress portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-sm space-y-3">
          <p className="text-rose-400 font-bold text-sm">{error || 'Project not found'}</p>
          {onClose && (
            <button onClick={onClose} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold text-white">
              Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const project = data.project;
  const latestDPR = data.latestDPR;
  const recentPhotos = data.recentPhotos || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Client Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
              <HardHat className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">
                Civil<span className="text-amber-400">Sense</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Verified Client Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Site Verified
            </span>
            {onClose && (
              <button onClick={onClose} className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg">
                Close
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* Hero Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 uppercase border border-slate-700">
                Residential Villa Construction
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5 leading-snug">
                {project.name}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{project.address}</span>
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0 p-3 sm:p-0 rounded-2xl bg-slate-950/60 sm:bg-transparent border border-slate-800/80 sm:border-0">
              <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                {project.completionPercentage}%
              </span>
              <span className="text-xs text-slate-400 block font-semibold">Overall Site Completion</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-700"
              style={{ width: `${project.completionPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Client: <strong className="text-slate-200">{project.client}</strong></span>
            <span>Target Handover: <strong className="text-slate-200">{formatDate(project.targetDate)}</strong></span>
          </div>
        </div>

        {/* Latest Site Engineer Daily Report */}
        {latestDPR && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Latest Verified Site Engineer Update
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {formatDate(latestDPR.date)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
              {latestDPR.workCompleted}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Weather: {latestDPR.weather}</span>
              <span>Site Engineer: {latestDPR.supervisorName}</span>
            </div>
          </div>
        )}

        {/* Verified Site Photo Feed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              Verified Site Photo Feed (GPS Tagged)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {recentPhotos.length} photos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentPhotos.map((photo, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md group">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-2.5 text-[10px] text-slate-300 font-mono">
                    <p className="font-bold text-amber-300 truncate">{photo.caption}</p>
                    <p className="text-[9px] text-slate-400">📍 {photo.gps}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Stages Checklist */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Project Milestone Timeline
          </h3>

          <div className="space-y-2">
            {(project.stages || []).map((stage, idx) => (
              <div
                key={stage.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                    stage.status === 'Completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : stage.status === 'In Progress'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-medium text-white truncate">{stage.name}</span>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  stage.status === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : stage.status === 'In Progress'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {stage.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
