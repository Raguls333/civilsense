import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';
import { 
  Building2, 
  X, 
  Plus, 
  Trash2, 
  UserCheck, 
  CreditCard, 
  Calendar, 
  Layers,
  Sparkles
} from 'lucide-react';

export const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const { token, user } = useAuth();
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Supervisors list & assigned supervisor
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(user?.id || '');

  // Custom Payment Milestones Builder
  const [milestones, setMilestones] = useState([
    { id: 'm1', name: 'Site Clearing & Earthwork', percent: 5, budget: 0, dueDate: '' },
    { id: 'm2', name: 'Footing & Foundation', percent: 15, budget: 0, dueDate: '' },
    { id: 'm3', name: 'Plinth Beam & Earth Filling', percent: 10, budget: 0, dueDate: '' },
    { id: 'm4', name: 'RCC Columns & Slab Casting', percent: 30, budget: 0, dueDate: '' },
    { id: 'm5', name: 'Brickwork & AAC Block Masonry', percent: 15, budget: 0, dueDate: '' },
    { id: 'm6', name: 'Plastering & Curing', percent: 10, budget: 0, dueDate: '' },
    { id: 'm7', name: 'MEP Electrical & Plumbing', percent: 8, budget: 0, dueDate: '' },
    { id: 'm8', name: 'Finishing, Flooring & Handover', percent: 7, budget: 0, dueDate: '' }
  ]);

  // Fetch supervisors on modal open
  useEffect(() => {
    if (isOpen && token) {
      fetch('/api/projects/supervisors', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const list = [...(data.supervisors || []), ...(data.owners || [])];
          setSupervisors(list);
          if (list.length > 0 && !selectedSupervisorId) {
            setSelectedSupervisorId(list[0].id);
          }
        })
        .catch(err => console.error('Failed to load supervisors:', err));
    }
  }, [isOpen, token]);

  // Recalculate milestone budgets whenever project budget changes
  useEffect(() => {
    const numBudget = Number(budget) || 0;
    if (numBudget > 0) {
      setMilestones(prev => prev.map(m => ({
        ...m,
        budget: Math.round(numBudget * ((Number(m.percent) || 0) / 100))
      })));
    }
  }, [budget]);

  if (!isOpen) return null;

  // Add custom milestone row
  const handleAddMilestone = () => {
    const numBudget = Number(budget) || 0;
    const newMilestone = {
      id: `m_${Date.now()}`,
      name: `Milestone ${milestones.length + 1}`,
      percent: 10,
      budget: numBudget > 0 ? Math.round(numBudget * 0.10) : 0,
      dueDate: targetDate || ''
    };
    setMilestones([...milestones, newMilestone]);
  };

  // Remove milestone row
  const handleRemoveMilestone = (id) => {
    if (milestones.length <= 1) {
      alert('At least one payment stage is required.');
      return;
    }
    setMilestones(milestones.filter(m => m.id !== id));
  };

  // Update milestone field
  const handleUpdateMilestone = (id, field, val) => {
    const numBudget = Number(budget) || 0;
    setMilestones(milestones.map(m => {
      if (m.id !== id) return m;
      if (field === 'percent') {
        const p = Number(val) || 0;
        return {
          ...m,
          percent: p,
          budget: numBudget > 0 ? Math.round(numBudget * (p / 100)) : m.budget
        };
      }
      if (field === 'budget') {
        const b = Number(val) || 0;
        return {
          ...m,
          budget: b,
          percent: numBudget > 0 ? Number(((b / numBudget) * 100).toFixed(1)) : m.percent
        };
      }
      return { ...m, [field]: val };
    }));
  };

  // Preset templates
  const loadPreset = (type) => {
    const numBudget = Number(budget) || 0;
    let template = [];
    if (type === 'villa') {
      template = [
        { name: 'Booking Advance', percent: 10 },
        { name: 'Foundation & Footing', percent: 20 },
        { name: 'Ground Floor Slab', percent: 25 },
        { name: 'First Floor Slab & Brickwork', percent: 25 },
        { name: 'Flooring, Painting & Handover', percent: 20 }
      ];
    } else if (type === 'commercial') {
      template = [
        { name: 'Mobilization Advance', percent: 15 },
        { name: 'Substructure & Piling', percent: 25 },
        { name: 'RCC Framing Superstructure', percent: 35 },
        { name: 'Façade, MEP & Finishing', percent: 25 }
      ];
    }

    setMilestones(template.map((t, idx) => ({
      id: `m_pre_${idx}`,
      name: t.name,
      percent: t.percent,
      budget: numBudget > 0 ? Math.round(numBudget * (t.percent / 100)) : 0,
      dueDate: targetDate || ''
    })));
  };

  const totalPercentAllocated = milestones.reduce((sum, m) => sum + (Number(m.percent) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !budget || Number(budget) <= 0) {
      alert('Please provide project name and budget.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          client: client.trim() || 'Client',
          clientPhone: clientPhone.trim(),
          budget: Number(budget),
          startDate,
          targetDate,
          address: address.trim(),
          supervisorId: selectedSupervisorId,
          stages: milestones.map(m => ({
            id: m.id,
            name: m.name,
            budget: Number(m.budget) || Math.round(Number(budget) * (Number(m.percent) / 100)),
            percent: Number(m.percent),
            dueDate: m.dueDate,
            progress: 0,
            status: 'Pending'
          }))
        })
      });

      if (res.ok) {
        const created = await res.json();
        onProjectCreated(created);
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create project');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Create New Construction Project</h3>
              <p className="text-[11px] text-slate-400">Configure client contract, supervisor assignee & payment milestones</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Project Name & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Project Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Meadows Luxury Villa #21"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Total Agreed Budget (₹) *</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 7500000"
                required
                min="1000"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
              />
              {budget && (
                <div className="text-[10px] text-amber-400 font-mono mt-0.5 text-right">
                  {formatINR(budget)}
                </div>
              )}
            </div>
          </div>

          {/* Supervisor Assignee (Owner Option) */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block text-xs font-bold text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Assign Site Supervisor / Project Engineer *</span>
            </label>
            <p className="text-[11px] text-slate-400">
              The assigned supervisor will manage daily labour attendance, site DPRs, and worker verification.
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

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Client / Owner Name</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g. Dr. Rajesh Reddy"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Client Mobile / WhatsApp</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="e.g. +91 98450 99887"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Dates & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Site Location / City</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Whitefield, Bengaluru"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Custom Payment Milestones Section */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Custom Payment Milestones & Stages</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Set custom payment schedule for RA Billing and Client Invoicing
                </p>
              </div>

              {/* Template shortcuts */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-500 font-semibold">Presets:</span>
                <button
                  type="button"
                  onClick={() => loadPreset('villa')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                >
                  5-Stage Villa
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('commercial')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700"
                >
                  4-Stage Comm.
                </button>
              </div>
            </div>

            {/* Milestones list table */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {milestones.map((m, idx) => (
                <div 
                  key={m.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs"
                >
                  <span className="w-5 text-center text-slate-500 font-mono text-[10px]">{idx + 1}</span>
                  
                  {/* Name */}
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => handleUpdateMilestone(m.id, 'name', e.target.value)}
                    placeholder="Milestone Name"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                  />

                  {/* Percentage */}
                  <div className="w-16 flex items-center gap-0.5">
                    <input
                      type="number"
                      value={m.percent}
                      onChange={(e) => handleUpdateMilestone(m.id, 'percent', e.target.value)}
                      min="1"
                      max="100"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-white font-mono text-center text-xs focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">%</span>
                  </div>

                  {/* Budget Amount */}
                  <div className="w-24">
                    <input
                      type="number"
                      value={m.budget}
                      onChange={(e) => handleUpdateMilestone(m.id, 'budget', e.target.value)}
                      placeholder="Budget"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-white font-mono text-right text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(m.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove Milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Milestone & Allocation Tally */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleAddMilestone}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Custom Milestone</span>
              </button>

              <div className="text-right text-[11px] font-mono">
                <span className="text-slate-400">Total Allocated: </span>
                <strong className={totalPercentAllocated === 100 ? 'text-emerald-400' : 'text-amber-400'}>
                  {totalPercentAllocated}%
                </strong>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
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
              disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              {loading ? 'Creating Project...' : 'Launch Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
