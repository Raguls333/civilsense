import express from 'express';
import { Project, Attendance, MaterialPurchase, PettyCash } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const CATEGORIES = [
  { key: 'Civil', name: 'Civil & Structural Works', budgetShare: 0.45 },
  { key: 'MEP', name: 'MEP (Electrical & Plumbing)', budgetShare: 0.14 },
  { key: 'Carpentry', name: 'Carpentry, Centering & Doors', budgetShare: 0.10 },
  { key: 'Paint', name: 'Painting & Surface Finishing', budgetShare: 0.08 },
  { key: 'Tiles', name: 'Flooring, Tiles & Granite', budgetShare: 0.09 },
  { key: 'Sanitary', name: 'Sanitaryware & CP Fittings', budgetShare: 0.04 },
  { key: 'Expenses', name: 'Site Expenses & Fuel', budgetShare: 0.03 },
  { key: 'Service Vendors', name: 'Machinery & Equipment Rental', budgetShare: 0.03 },
  { key: 'Watchman', name: 'Watchman & Site Security', budgetShare: 0.015 },
  { key: 'Consultants', name: 'Architects & Structural Consultants', budgetShare: 0.015 },
  { key: 'Misc', name: 'Miscellaneous & Contingency', budgetShare: 0.01 }
];

router.get('/summary/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    const totalBudget = Number(project.budget) || 0;

    // Fetch data
    const attendances = await Attendance.find({ projectId });
    const purchases = await MaterialPurchase.find({ projectId });
    const pettyCashLogs = await PettyCash.find({ projectId });

    // Aggregate labor wages by category
    const laborMap = {};
    attendances.forEach(att => {
      (att.entries || []).forEach(entry => {
        const catName = entry.category || '';
        let targetCategory = 'Civil';
        if (catName.toLowerCase().includes('electric') || catName.toLowerCase().includes('plumb')) targetCategory = 'MEP';
        else if (catName.toLowerCase().includes('carpent') || catName.toLowerCase().includes('shutter')) targetCategory = 'Carpentry';
        else if (catName.toLowerCase().includes('paint')) targetCategory = 'Paint';
        else if (catName.toLowerCase().includes('tile')) targetCategory = 'Tiles';

        laborMap[targetCategory] = (laborMap[targetCategory] || 0) + (entry.subtotal || 0);
      });
    });

    // Aggregate material purchases by category
    const materialMap = {};
    purchases.forEach(p => {
      const cat = p.category || 'Civil';
      materialMap[cat] = (materialMap[cat] || 0) + (p.totalCost || 0);
    });

    // Aggregate petty cash & other expenses
    const othersMap = {};
    pettyCashLogs.filter(p => p.type === 'OUT').forEach(p => {
      let target = 'Expenses';
      const note = (p.note || '').toLowerCase();
      if (note.includes('diesel') || note.includes('machine') || note.includes('rent')) target = 'Service Vendors';
      else if (note.includes('watchman') || note.includes('security')) target = 'Watchman';
      othersMap[target] = (othersMap[target] || 0) + (p.amount || 0);
    });

    // Generate full matrix
    let grandMaterial = 0;
    let grandLabor = 0;
    let grandOthers = 0;
    let grandTotal = 0;

    const matrix = CATEGORIES.map(cat => {
      const matCost = materialMap[cat.key] || 0;
      const labCost = laborMap[cat.key] || 0;
      const othCost = othersMap[cat.key] || 0;
      const rowTotal = matCost + labCost + othCost;
      const rowBudget = Math.round(totalBudget * cat.budgetShare);
      const variancePercent = rowBudget > 0 ? (((rowTotal - rowBudget) / rowBudget) * 100).toFixed(1) : 0;

      grandMaterial += matCost;
      grandLabor += labCost;
      grandOthers += othCost;
      grandTotal += rowTotal;

      return {
        key: cat.key,
        name: cat.name,
        material: matCost,
        labor: labCost,
        others: othCost,
        total: rowTotal,
        budget: rowBudget,
        variancePercent: Number(variancePercent),
        status: rowTotal > rowBudget ? 'Over Budget' : (rowTotal > rowBudget * 0.85 ? 'Watch' : 'On Track')
      };
    });

    res.json({
      project: {
        id: project.id,
        name: project.name,
        budget: totalBudget,
        spentCost: Math.max(project.spentCost || 0, grandTotal),
        completionPercentage: project.completionPercentage
      },
      matrix,
      totals: {
        material: grandMaterial,
        labor: grandLabor,
        others: grandOthers,
        totalSpent: grandTotal,
        budget: totalBudget,
        remainingBudget: Math.max(0, totalBudget - grandTotal),
        overallBurnRate: totalBudget > 0 ? ((grandTotal / totalBudget) * 100).toFixed(1) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
