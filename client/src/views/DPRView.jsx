import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOfflineSync } from '../context/OfflineSyncContext';
import { formatDate } from '../utils/formatters';
import { getTranslation } from '../utils/i18n';
import { 
  ClipboardList, 
  Camera, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Sun, 
  CloudRain, 
  Send, 
  Check, 
  ChevronRight,
  ShieldAlert,
  Image as ImageIcon
} from 'lucide-react';

export const DPRView = () => {
  const { token, user, activeProjectId, lang } = useAuth();
  const { queueDPR, isOnline } = useOfflineSync();

  const [activeSubTab, setActiveSubTab] = useState('dpr'); // 'dpr', 'stages', 'issues'
  const [dprs, setDprs] = useState([]);
  const [issues, setIssues] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // New DPR Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('Sunny / 30°C');
  const [selectedStage, setSelectedStage] = useState('');
  const [workCompleted, setWorkCompleted] = useState('');
  const [delaysOrBlockers, setDelaysOrBlockers] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submittingDpr, setSubmittingDpr] = useState(false);
  const [dprSuccess, setDprSuccess] = useState(false);

  // New Issue Form State
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePriority, setIssuePriority] = useState('High');
  const [issueCategory, setIssueCategory] = useState('Civil / Concrete');
  const [issueDueDate, setIssueDueDate] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/projects/${activeProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`/api/dpr?projectId=${activeProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`/api/dpr/issues?projectId=${activeProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ])
      .then(([projData, dprData, issueData]) => {
        setProject(projData);
        if (Array.isArray(dprData)) setDprs(dprData);
        if (Array.isArray(issueData)) setIssues(issueData);
        if (projData?.stages?.length > 0 && !selectedStage) {
          setSelectedStage(projData.stages[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) loadData();
  }, [token, activeProjectId]);

  // Simulate Photo Upload with GPS/timestamp tag
  const handleAddPhoto = () => {
    const samplePhotos = [
      {
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=600&q=80',
        caption: 'RCC Slab Beam Reinforcement',
        timestamp: new Date().toLocaleTimeString('en-IN') + ', ' + date,
        gps: '12.9716° N, 77.7499° E'
      },
      {
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
        caption: 'Column Formwork Alignment Verification',
        timestamp: new Date().toLocaleTimeString('en-IN') + ', ' + date,
        gps: '12.9718° N, 77.7501° E'
      }
    ];
    const pick = samplePhotos[photos.length % samplePhotos.length];
    setPhotos(prev => [...prev, pick]);
  };

  // Submit DPR
  const handleSubmitDpr = async (e) => {
    e.preventDefault();
    if (!workCompleted.trim()) {
      alert('Please describe work completed today.');
      return;
    }

    setSubmittingDpr(true);
    const stageObj = project?.stages?.find(s => s.id === selectedStage);

    const payload = {
      projectId: activeProjectId,
      date,
      weather,
      stageId: selectedStage,
      stageName: stageObj ? stageObj.name : 'Civil Superstructure',
      workersCount: 20,
      workCompleted,
      delaysOrBlockers: delaysOrBlockers || 'None',
      photos,
      issuesCount: issues.filter(i => i.status !== 'Resolved').length
    };

    if (!navigator.onLine) {
      queueDPR(payload);
      setSubmittingDpr(false);
      setDprSuccess(true);
      setTimeout(() => {
        setDprSuccess(false);
        setWorkCompleted('');
        setDelaysOrBlockers('');
        setPhotos([]);
        loadData();
      }, 1500);
      return;
    }

    try {
      const res = await fetch('/api/dpr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setDprSuccess(true);
        setTimeout(() => {
          setDprSuccess(false);
          setWorkCompleted('');
          setDelaysOrBlockers('');
          setPhotos([]);
          loadData();
        }, 1200);
      }
    } catch (err) {
      queueDPR(payload);
      setDprSuccess(true);
      setTimeout(() => setDprSuccess(false), 1500);
    } finally {
      setSubmittingDpr(false);
    }
  };

  // Create Site Issue
  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/dpr/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: activeProjectId,
          title: issueTitle,
          description: issueDesc,
          category: issueCategory,
          priority: issuePriority,
          dueDate: issueDueDate,
          photoUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=500&q=80'
        })
      });

      if (res.ok) {
        setShowNewIssueModal(false);
        setIssueTitle('');
        setIssueDesc('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Issue Status (Open -> In Progress -> Resolved)
  const handleToggleIssueStatus = async (issueId, currentStatus) => {
    const nextStatus = currentStatus === 'Open' ? 'In Progress' : (currentStatus === 'In Progress' ? 'Resolved' : 'Open');
    try {
      await fetch(`/api/dpr/issues/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-400" />
            <span>{getTranslation(lang, 'dpr')}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Daily logs, GPS photo feed & construction stage checklists
          </p>
        </div>

        {/* Sub-tabs: DPR Form, Stages Checklist, Defect Issues */}
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('dpr')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'dpr' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Submit DPR
          </button>
          <button
            onClick={() => setActiveSubTab('stages')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'stages' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stages ({project?.stages?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('issues')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              activeSubTab === 'issues' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Issues ({issues.filter(i => i.status !== 'Resolved').length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'dpr' ? (
        <form onSubmit={handleSubmitDpr} className="space-y-3.5">
          {/* Top Info Card: Date, Weather, Construction Stage */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  📅 Log Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  🌤️ Site Weather
                </label>
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Sunny / 30°C">☀️ Sunny / 30°C</option>
                  <option value="Clear / 28°C">🌤️ Clear / 28°C</option>
                  <option value="Overcast / 26°C">☁️ Overcast / 26°C</option>
                  <option value="Light Rain / 24°C">🌧️ Light Rain / 24°C</option>
                  <option value="Heavy Rain / Halted">⛈️ Heavy Rain / Halted</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                🏗️ Construction Stage Underway
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
              >
                {(project?.stages || []).map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.progress}% done)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Work Completed Text Area */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2 shadow-lg">
            <label className="block text-xs font-bold text-white">
              📝 Work Completed Today
            </label>
            <textarea
              rows="3"
              value={workCompleted}
              onChange={(e) => setWorkCompleted(e.target.value)}
              placeholder="e.g. 1. De-shuttered columns C12 to C16. 2. Steel bar tying completed for Villa 16 roof beam. 3. Brickwork started on north wall."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Site Delays / Blockers */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2 shadow-lg">
            <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Delays or Site Blockers (if any)
            </label>
            <input
              type="text"
              value={delaysOrBlockers}
              onChange={(e) => setDelaysOrBlockers(e.target.value)}
              placeholder="e.g. Electricity outage for 45 mins; Sand truck arrived at 2 PM"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Photos with GPS/Timestamp Overlay */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-400" />
                  Site Progress Photos (GPS Watermarked)
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Auto-stamps site coordinates and time onto report
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddPhoto}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Snap / Add Photo</span>
              </button>
            </div>

            {photos.length === 0 ? (
              <div 
                onClick={handleAddPhoto}
                className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-4 text-center cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                <p className="text-xs font-medium">Tap to capture or attach verified site photo</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                    <img src={p.url} alt={p.caption} className="w-full h-28 object-cover" />
                    {/* Watermark badge overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 backdrop-blur-xs p-1.5 text-[9px] text-slate-300 font-mono leading-tight">
                      <p className="font-bold text-amber-400 truncate">{p.caption}</p>
                      <p className="truncate">📍 {p.gps}</p>
                      <p className="text-slate-400">🕒 {p.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submittingDpr}
            className={`w-full py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98] ${
              dprSuccess
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {dprSuccess ? (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>{isOnline ? 'DPR Submitted to Owner!' : 'DPR Queued Locally!'}</span>
              </>
            ) : submittingDpr ? (
              <span>Saving DPR...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{isOnline ? 'Submit Daily Progress Report' : 'Save DPR to Offline Queue'}</span>
              </>
            )}
          </button>
        </form>
      ) : activeSubTab === 'stages' ? (
        /* Construction Stage Checklist Tracker */
        <div className="space-y-2.5">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-slate-400">Overall Construction Progress:</span>
            <span className="font-mono font-black text-amber-400 text-sm">
              {project?.completionPercentage}%
            </span>
          </div>

          {(project?.stages || []).map((stage, idx) => (
            <div
              key={stage.id}
              className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-mono text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm text-white">{stage.name}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  stage.status === 'Completed' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : stage.status === 'In Progress' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {stage.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    stage.progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${stage.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Progress: <strong className="text-slate-200">{stage.progress}%</strong></span>
                <span>Budget: ₹{(stage.budget || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Defect & Issue Tracker */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Site Issues & Defect Tags ({issues.length})
            </span>
            <button
              onClick={() => setShowNewIssueModal(true)}
              className="flex items-center gap-1 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md shadow-rose-500/20 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Report Issue</span>
            </button>
          </div>

          {issues.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No defect issues reported. Site works clear!
            </div>
          ) : (
            issues.map(issue => (
              <div
                key={issue.id}
                className={`p-4 rounded-2xl border transition-all space-y-2.5 shadow-md ${
                  issue.status === 'Resolved'
                    ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        issue.priority === 'Critical' 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                          : issue.priority === 'High' 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {issue.priority} Priority
                      </span>
                      <span className="text-xs text-slate-400">Category: {issue.category}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mt-1 leading-snug">
                      {issue.title}
                    </h4>
                  </div>

                  <button
                    onClick={() => handleToggleIssueStatus(issue.id, issue.status)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all ${
                      issue.status === 'Resolved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : issue.status === 'In Progress'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {issue.status}
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{issue.description}</p>

                {issue.photoUrl && (
                  <div className="rounded-xl overflow-hidden h-28 max-w-xs border border-slate-800">
                    <img src={issue.photoUrl} alt="Defect" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Assigned: <strong className="text-slate-300">{issue.assignedTo}</strong></span>
                  <span>Due: {formatDate(issue.dueDate)}</span>
                </div>
              </div>
            ))
          )}

          {/* New Issue Modal */}
          {showNewIssueModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Report Site Issue / Defect
                </h3>

                <form onSubmit={handleCreateIssue} className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Issue Title</label>
                    <input
                      type="text"
                      value={issueTitle}
                      onChange={(e) => setIssueTitle(e.target.value)}
                      placeholder="e.g. Honeycombing in column C4"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Description & Rectification</label>
                    <textarea
                      rows="2"
                      value={issueDesc}
                      onChange={(e) => setIssueDesc(e.target.value)}
                      placeholder="e.g. Requires grout packing before brickwork"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Priority</label>
                      <select
                        value={issuePriority}
                        onChange={(e) => setIssuePriority(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Rectification Due</label>
                      <input
                        type="date"
                        value={issueDueDate}
                        onChange={(e) => setIssueDueDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewIssueModal(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl"
                    >
                      Save Defect
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
