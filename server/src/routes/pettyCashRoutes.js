import express from 'express';
import { PettyCash } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all petty cash entries for a project
router.get('/', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { projectId } : {};
    const list = await PettyCash.find(query);
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Compute live balance
    let totalIn = 0;
    let totalOut = 0;
    list.forEach(item => {
      if (item.type === 'IN') totalIn += Number(item.amount || 0);
      if (item.type === 'OUT') totalOut += Number(item.amount || 0);
    });

    res.json({
      entries: list,
      summary: {
        totalIn,
        totalOut,
        balance: totalIn - totalOut
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST record cash in / out
router.post('/', requireAuth, async (req, res) => {
  try {
    const { projectId, type, amount, category, note, receiptUrl } = req.body;
    if (!projectId || !amount || !type) {
      return res.status(400).json({ error: 'ProjectId, type (IN/OUT), and amount are required.' });
    }

    const numAmount = Math.abs(Number(amount));

    // Get current balance
    const existing = await PettyCash.find({ projectId });
    let currentBalance = 0;
    existing.forEach(item => {
      if (item.type === 'IN') currentBalance += Number(item.amount || 0);
      if (item.type === 'OUT') currentBalance -= Number(item.amount || 0);
    });

    const newBalance = type === 'IN' ? currentBalance + numAmount : currentBalance - numAmount;

    const entry = await PettyCash.create({
      projectId,
      date: new Date().toISOString().split('T')[0],
      type,
      amount: numAmount,
      category: category || (type === 'IN' ? 'Cash Top-up' : 'Site Expense'),
      note: note || '',
      receiptUrl: receiptUrl || '',
      loggedBy: req.user.name,
      balanceAfter: newBalance
    });

    res.status(201).json({ entry, balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
