import express from 'express';
import { Attendance, WageCategory, Project } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all wage categories
router.get('/wage-categories', requireAuth, async (req, res) => {
  try {
    const categories = await WageCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update wage category rate
router.put('/wage-categories/:id', requireAuth, async (req, res) => {
  try {
    const { defaultRate } = req.body;
    const updated = await WageCategory.findByIdAndUpdate(req.params.id, {
      defaultRate: Number(defaultRate)
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET attendances by project and optional date
router.get('/', requireAuth, async (req, res) => {
  try {
    const { projectId, date } = req.query;
    const query = {};
    if (projectId) query.projectId = projectId;
    if (date) query.date = date;

    const attendances = await Attendance.find(query);
    // Sort reverse chronological
    attendances.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(attendances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to compute totals
const processAttendanceEntry = (body, user) => {
  const {
    projectId,
    contractorId,
    contractorName,
    date,
    shift,
    entries = [],
    gps,
    photoUrl,
    notes,
    syncedOffline
  } = body;

  let totalWorkers = 0;
  let totalWage = 0;

  const rawEntries = Array.isArray(entries) ? entries : (entries ? [entries] : []);
  const calculatedEntries = rawEntries.map(item => {
    const count = Number(item.count) || 0;
    const rate = Number(item.rate) || 0;
    const subtotal = count * rate;
    totalWorkers += count;
    totalWage += subtotal;
    return {
      categoryId: item.categoryId || item.id || 'cat_gen',
      category: item.category || item.name || 'Worker',
      count,
      rate,
      subtotal
    };
  });

  return {
    projectId,
    contractorId: contractorId || 'direct',
    contractorName: contractorName || 'Direct Labor',
    date: date || new Date().toISOString().split('T')[0],
    shift: shift || 'Morning',
    supervisorId: user?.id || 'usr_sup_1',
    supervisorName: user?.name || 'Site Supervisor',
    entries: calculatedEntries,
    totalWorkers,
    totalWage,
    gps: gps || null,
    photoUrl: photoUrl || '',
    notes: notes || '',
    syncedOffline: Boolean(syncedOffline),
    recordedAt: body.recordedAt || body.timestamp || new Date().toISOString(),
    markedTime: body.markedTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  };
};

// POST single attendance (Live logging)
router.post('/', requireAuth, async (req, res) => {
  try {
    const data = processAttendanceEntry(req.body, req.user);
    if (!data.projectId) {
      return res.status(400).json({ error: 'ProjectId is required.' });
    }

    const created = await Attendance.create(data);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST offline-queue batch sync
router.post('/sync-batch', requireAuth, async (req, res) => {
  try {
    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ syncedCount: 0, items: [] });
    }

    const saved = [];
    for (const item of items) {
      const data = processAttendanceEntry({
        ...item,
        syncedOffline: true
      }, req.user);

      // Check for duplicate by project, contractor, date, shift
      const existing = await Attendance.findOne({
        projectId: data.projectId,
        contractorId: data.contractorId,
        date: data.date,
        shift: data.shift
      });

      if (existing) {
        // Update existing record
        const updated = await Attendance.findByIdAndUpdate(existing.id, data);
        saved.push(updated);
      } else {
        const created = await Attendance.create(data);
        saved.push(created);
      }
    }

    res.json({
      success: true,
      syncedCount: saved.length,
      saved
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
