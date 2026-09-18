import express from 'express';
import { DPR, Issue, Project } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all DPRs for a project
router.get('/', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { projectId } : {};
    const dprs = await DPR.find(query);
    dprs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(dprs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST single DPR
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      projectId,
      date,
      weather,
      stageId,
      stageName,
      workersCount,
      workCompleted,
      delaysOrBlockers,
      photos = [],
      issuesCount = 0,
      syncedOffline = false
    } = req.body;

    if (!projectId || !workCompleted) {
      return res.status(400).json({ error: 'ProjectId and workCompleted are required.' });
    }

    const dpr = await DPR.create({
      projectId,
      date: date || new Date().toISOString().split('T')[0],
      weather: weather || 'Sunny / 30°C',
      stageId: stageId || '',
      stageName: stageName || 'Civil Superstructure',
      supervisorName: req.user.name || 'Site Supervisor',
      workersCount: Number(workersCount) || 0,
      workCompleted,
      delaysOrBlockers: delaysOrBlockers || 'None',
      photos,
      issuesCount: Number(issuesCount) || 0,
      syncedOffline: Boolean(syncedOffline),
      status: 'Submitted'
    });

    res.status(201).json(dpr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST DPR batch sync for offline queue
router.post('/sync-batch', requireAuth, async (req, res) => {
  try {
    const { items = [] } = req.body;
    const saved = [];
    for (const item of items) {
      const created = await DPR.create({
        ...item,
        supervisorName: req.user.name,
        syncedOffline: true
      });
      saved.push(created);
    }
    res.json({ success: true, syncedCount: saved.length, saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET site issues
router.get('/issues', requireAuth, async (req, res) => {
  try {
    const { projectId, status } = req.query;
    const query = {};
    if (projectId) query.projectId = projectId;
    if (status) query.status = status;

    const issues = await Issue.find(query);
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create issue
router.post('/issues', requireAuth, async (req, res) => {
  try {
    const { projectId, title, description, category, priority, dueDate, photoUrl } = req.body;
    if (!projectId || !title) {
      return res.status(400).json({ error: 'ProjectId and title are required.' });
    }

    const issue = await Issue.create({
      projectId,
      title,
      description: description || '',
      category: category || 'General Site',
      priority: priority || 'Medium',
      status: 'Open',
      assignedTo: req.user.name,
      dueDate: dueDate || '',
      photoUrl: photoUrl || '',
      createdAt: new Date().toISOString().split('T')[0]
    });

    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update / resolve issue
router.put('/issues/:id', requireAuth, async (req, res) => {
  try {
    const updated = await Issue.findByIdAndUpdate(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Issue not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
