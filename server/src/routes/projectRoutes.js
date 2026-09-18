import express from 'express';
import { Project, Attendance, MaterialPurchase, DPR, Issue, User, PettyCash, LedgerEntry } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to calculate live spent cost for a project across all interconnected modules
const calculateLiveCost = async (projectId) => {
  const attendances = await Attendance.find({ projectId });
  const laborCost = attendances.reduce((sum, a) => sum + (a.totalWage || 0), 0);

  const purchases = await MaterialPurchase.find({ projectId });
  const materialCost = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);

  const pettyCashLogs = await PettyCash.find({ projectId });
  const pettyCashCost = pettyCashLogs.filter(p => p.type === 'OUT').reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    laborCost,
    materialCost,
    pettyCashCost,
    totalSpent: laborCost + materialCost + pettyCashCost
  };
};

// GET all registered supervisors & owners (for Owner supervisor assignment)
router.get('/supervisors', requireAuth, async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'Supervisor' });
    const owners = await User.find({ role: 'Owner' });
    res.json({
      supervisors: supervisors.map(s => ({ id: s.id, name: s.name, phone: s.phone, role: s.role })),
      owners: owners.map(o => ({ id: o.id, name: o.name, phone: o.phone, role: o.role }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all projects accessible to current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    let allProjects = await Project.find();

    // If Supervisor or Contractor, filter by projectAccess
    if (user.role === 'Supervisor' || user.role === 'Contractor') {
      allProjects = allProjects.filter(p => user.projectAccess?.includes(p.id) || p.supervisorId === user.id);
    }

    // Enrich with dynamic live cost
    const enriched = await Promise.all(allProjects.map(async (proj) => {
      const costs = await calculateLiveCost(proj.id);
      const liveSpent = Math.max(proj.spentCost || 0, costs.totalSpent);
      const variancePercent = proj.budget > 0 ? ((liveSpent / proj.budget) * 100).toFixed(1) : 0;

      return {
        ...proj,
        calculatedLaborCost: costs.laborCost,
        calculatedMaterialCost: costs.materialCost,
        calculatedPettyCashCost: costs.pettyCashCost,
        liveCost: liveSpent,
        variancePercent: Number(variancePercent)
      };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project detail
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const proj = await Project.findById(req.params.id);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const costs = await calculateLiveCost(proj.id);
    const liveSpent = Math.max(proj.spentCost || 0, costs.totalSpent);

    res.json({
      ...proj,
      liveCost: liveSpent,
      calculatedLaborCost: costs.laborCost,
      calculatedMaterialCost: costs.materialCost,
      calculatedPettyCashCost: costs.pettyCashCost
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create project with custom payment milestones & supervisor assignee
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, client, clientPhone, budget, startDate, targetDate, address, supervisorId, stages } = req.body;
    if (!name || !budget) {
      return res.status(400).json({ error: 'Project name and budget are required.' });
    }

    const numBudget = Number(budget);

    // Resolve assigned supervisor name
    let selectedSupervisorName = req.user.name;
    let finalSupervisorId = supervisorId || req.user.id;
    if (supervisorId) {
      const supUser = await User.findById(supervisorId);
      if (supUser) {
        selectedSupervisorName = supUser.name;
        finalSupervisorId = supUser.id;
      }
    }

    // Process custom payment milestones/stages if provided, or supply industry defaults
    const projectStages = Array.isArray(stages) && stages.length > 0 ? stages.map((s, idx) => {
      const stageBudget = Number(s.budget) || Math.round(numBudget * ((Number(s.percent) || 10) / 100));
      const stagePercent = numBudget > 0 ? Number(((stageBudget / numBudget) * 100).toFixed(1)) : 10;
      return {
        id: s.id || `stg_${Date.now()}_${idx}`,
        name: s.name || `Payment Stage ${idx + 1}`,
        progress: Number(s.progress) || 0,
        status: s.status || (Number(s.progress) === 100 ? 'Completed' : Number(s.progress) > 0 ? 'In Progress' : 'Pending'),
        budget: stageBudget,
        percent: stagePercent,
        dueDate: s.dueDate || targetDate || ''
      };
    }) : [
      { id: 's1', name: 'Site Clearing & Earthwork', progress: 0, status: 'Pending', percent: 5, budget: Math.round(numBudget * 0.05) },
      { id: 's2', name: 'Footing & Foundation', progress: 0, status: 'Pending', percent: 15, budget: Math.round(numBudget * 0.15) },
      { id: 's3', name: 'Plinth Beam & Earth Filling', progress: 0, status: 'Pending', percent: 10, budget: Math.round(numBudget * 0.10) },
      { id: 's4', name: 'RCC Superstructure & Slab (G+1)', progress: 0, status: 'Pending', percent: 30, budget: Math.round(numBudget * 0.30) },
      { id: 's5', name: 'Brickwork & AAC Block Masonry', progress: 0, status: 'Pending', percent: 15, budget: Math.round(numBudget * 0.15) },
      { id: 's6', name: 'Plastering (Internal & External)', progress: 0, status: 'Pending', percent: 10, budget: Math.round(numBudget * 0.10) },
      { id: 's7', name: 'MEP Electrical & Plumbing Rough-in', progress: 0, status: 'Pending', percent: 8, budget: Math.round(numBudget * 0.08) },
      { id: 's8', name: 'Finishing, Tiles & Painting', progress: 0, status: 'Pending', percent: 7, budget: Math.round(numBudget * 0.07) }
    ];

    // Compute weighted completion percentage
    const totalWeighted = projectStages.reduce((sum, s) => sum + ((s.progress || 0) * (s.budget || 0)), 0);
    const overallCompletion = numBudget > 0 ? Math.min(100, Math.round(totalWeighted / numBudget)) : 0;

    const shareToken = 'pub_' + Math.random().toString(36).substring(2, 10);
    const newProject = await Project.create({
      name,
      code: 'PRJ-' + Date.now().toString().slice(-4),
      client: client || 'Client',
      clientPhone: clientPhone || '',
      budget: numBudget,
      spentCost: 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      targetDate: targetDate || '',
      address: address || '',
      supervisorId: finalSupervisorId,
      supervisorName: selectedSupervisorName,
      status: 'In Progress',
      completionPercentage: overallCompletion,
      shareToken,
      stages: projectStages
    });

    // Automatically sync access for the assigned supervisor
    if (finalSupervisorId) {
      const supUser = await User.findById(finalSupervisorId);
      if (supUser) {
        const access = supUser.projectAccess || [];
        if (!access.includes(newProject.id)) {
          await User.findByIdAndUpdate(finalSupervisorId, { projectAccess: [...access, newProject.id] });
        }
      }
    }

    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update project, stages/milestones, or reassign supervisor
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { supervisorId, stages, budget } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let updates = { ...req.body };

    // If supervisor was reassigned
    if (supervisorId && supervisorId !== project.supervisorId) {
      const supUser = await User.findById(supervisorId);
      if (supUser) {
        updates.supervisorName = supUser.name;
        // Grant projectAccess to new supervisor
        const currentAccess = supUser.projectAccess || [];
        if (!currentAccess.includes(project.id)) {
          await User.findByIdAndUpdate(supervisorId, { projectAccess: [...currentAccess, project.id] });
        }
      }
    }

    // Recompute overall completion % if stages or budget changed
    const targetBudget = budget !== undefined ? Number(budget) : project.budget;
    const targetStages = stages || project.stages;
    if (Array.isArray(targetStages) && targetBudget > 0) {
      const totalWeighted = targetStages.reduce((sum, s) => sum + ((Number(s.progress) || 0) * (Number(s.budget) || 0)), 0);
      updates.completionPercentage = Math.min(100, Math.round(totalWeighted / targetBudget));
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUBLIC Read-Only client view (NO LOGIN REQUIRED)
router.get('/public/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const proj = await Project.findOne({ shareToken: token });
    if (!proj) {
      return res.status(404).json({ error: 'Invalid or expired project public link.' });
    }

    const dprs = await DPR.find({ projectId: proj.id });
    const issues = await Issue.find({ projectId: proj.id });

    // Extract all site photos
    const allPhotos = [];
    dprs.forEach(d => {
      if (d.photos && Array.isArray(d.photos)) {
        d.photos.forEach(p => {
          allPhotos.push({
            ...p,
            date: d.date,
            stageName: d.stageName
          });
        });
      }
    });

    res.json({
      project: {
        id: proj.id,
        name: proj.name,
        client: proj.client,
        budget: proj.budget,
        completionPercentage: proj.completionPercentage,
        startDate: proj.startDate,
        targetDate: proj.targetDate,
        address: proj.address,
        status: proj.status,
        stages: proj.stages
      },
      latestDPR: dprs[0] || null,
      recentPhotos: allPhotos.slice(0, 12),
      activeIssuesCount: issues.filter(i => i.status !== 'Resolved').length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
