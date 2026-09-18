import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';
import { 
  Settings, 
  X, 
  UserCheck, 
  Plus, 
  Trash2, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Save
} from 'lucide-react';

export const ProjectSettingsModal = ({ isOpen, onClose, project, onProjectUpdated }) => {
  const { token, user } = useAuth();
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [targetDate, setTargetDate] = useState('');
  const [address, setAddress] = useState('');
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [stages, setStages] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setClient(project.client || '');
      setClientPhone(project.clientPhone || '');
      setBudget(project.budget || '');
      setStatus(project.status || 'In Progress');
      setTargetDate(project.targetDate || '');
      setAddress(project.address || '');
      setSelectedSupervisorId(project.supervisorId || '');
      setStages(project.stages || []);
    }
  }, [project]);

  useEffect(() => {
    if (isOpen && token) {
      fetch('/api/projects/supervisors', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const list = [...(data.supervisors || []), ...(data.owners || [])];
          setSupervisors(list);
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, token]);

  if (!isOpen || !project) return null;

  const handleAddStage = () => {
    const numBudget = Number(budget) || 0;
    const newStage = {
      id: `stg_${Date.now()}`,
      name: `Stage ${stages.length + 1}`,
      percent: 10,
      budget: numBudget > 0 ? Math.round(numBudget * 0.1) : 0,
      progress: 0,
      status: 'Pending',
      dueDate: targetDate || ''
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (id) => {
    if (stages.length <= 1) {
      alert('At least one payment stage is required.');
      return;
    }
    setStages(stages.filter(s => s.id !== id));
  };

  const handleUpdateStage = (id, field, val) => {
    const numBudget = Number(budget) || 0;
    setStages(stages.map(s => {
      if (s.id !== id) return s;
      if (field === 'progress') {
        const prog = Math.min(100, Math.max(0, Number(val) || 0));
        return {
          ...s,
          progress: prog,
          status: prog === 100 ? 'Completed' : prog > 0 ? 'In Progress' : 'Pending'
        };
      }
      if (field === 'percent') {
        const p = Number(val) || 0;
        return {
          ...s,
          percent: p,
          budget: numBudget > 0 ? Math.round(numBudget * (p / 100)) : s.budget
        };
      }
      if (field === 'budget') {
        const b = Number(val) || 0;
        return {
          ...s,
          budget: b,
          percent: numBudget > 0 ? Number(((b / numBudget) * 100).toFixed(1)) : s.percent
        };
      }
      return { ...s, [field]: val };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          client,
          clientPhone,
          budget: Number(budget),
          status,
          targetDate,
          address,
          supervisorId: selectedSupervisorId,
          stages
        })
      });

      if (res.ok) {
        const updated = await res.json();
        onProjectUpdated(updated);
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update project settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Project Settings & Assignee</h3>
              <p className="text-xs text-slate-400">{project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Supervisor Assignee */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Assigned Site Supervisor / Engineer</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Reassign site operations, attendance logging, and DPR permissions.
            </p>
            <select
              value={selectedSupervisorId}
              onChange={(e) => setSelectedSupervisorId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-400"
            >
              {supervisors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role} • {s.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Total Agreed Budget (₹)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Client Name</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Handover</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Custom Payment Milestones & Progress Tracking */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Custom Payment Milestones & Stage Progress</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Update completion % to recalculate live progress and RA billing claims
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStage}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {stages.map((stg, idx) => (
                <div 
                  key={stg.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-[10px] w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={stg.name}
                      onChange={(e) => handleUpdateStage(stg.id, 'name', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-semibold focus:outline-none focus:border-amber-400"
                    />
                    <div className="w-24">
                      <input
                        type="number"
                        value={stg.budget}
                        onChange={(e) => handleUpdateStage(stg.id, 'budget', e.target.value)}
                        placeholder="Budget ₹"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-right text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStage(stg.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress slider & status */}
                  <div className="flex items-center gap-3 pl-6">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Progress:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stg.progress || 0}
                        onChange={(e) => handleUpdateStage(stg.id, 'progress', e.target.value)}
                        className="flex-1 accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <span className="font-mono font-bold text-amber-400 w-10 text-right">
                        {stg.progress || 0}%
                      </span>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold font-mono ${
                      stg.progress === 100 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                        : stg.progress > 0 
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {stg.status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
