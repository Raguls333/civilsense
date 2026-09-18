import express from 'express';
import { RABill, Project } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all RA bills for a project
router.get('/', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { projectId } : {};
    const bills = await RABill.find(query);
    bills.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST generate new GST-Ready RA Bill
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      projectId,
      billNo,
      periodStart,
      periodEnd,
      items = [],
      retentionPercent = 5,
      tdsPercent = 2,
      isInterstate = false // false = CGST 9% + SGST 9%, true = IGST 18%
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    // Calculate subtotal of claimed items
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const numRetentionPercent = Number(retentionPercent) || 5;
    const retentionAmount = Math.round((subtotal * numRetentionPercent) / 100);

    const taxableAmount = subtotal - retentionAmount;

    let cgstPercent = 0;
    let cgstAmount = 0;
    let sgstPercent = 0;
    let sgstAmount = 0;
    let igstPercent = 0;
    let igstAmount = 0;

    if (isInterstate) {
      igstPercent = 18;
      igstAmount = Math.round((taxableAmount * 18) / 100);
    } else {
      cgstPercent = 9;
      cgstAmount = Math.round((taxableAmount * 9) / 100);
      sgstPercent = 9;
      sgstAmount = Math.round((taxableAmount * 9) / 100);
    }

    const totalWithGst = taxableAmount + cgstAmount + sgstAmount + igstAmount;

    // Deduct TDS
    const numTdsPercent = Number(tdsPercent) || 2;
    const tdsAmount = Math.round((taxableAmount * numTdsPercent) / 100);

    // Fetch previous bills to get previous cumulative paid
    const prevBills = await RABill.find({ projectId });
    const previousBillsTotal = prevBills.reduce((sum, b) => sum + (Number(b.netPayable) || 0), 0);

    const netPayable = totalWithGst - tdsAmount;

    const newBillNo = billNo || `RA-BILL-0${(prevBills.length + 1).toString().padStart(2, '0')}`;

    const created = await RABill.create({
      billNo: newBillNo,
      projectId,
      projectName: project.name,
      clientName: project.client,
      clientAddress: project.address,
      date: new Date().toISOString().split('T')[0],
      periodStart: periodStart || new Date().toISOString().split('T')[0],
      periodEnd: periodEnd || new Date().toISOString().split('T')[0],
      items,
      subtotal,
      retentionPercent: numRetentionPercent,
      retentionAmount,
      taxableAmount,
      cgstPercent,
      cgstAmount,
      sgstPercent,
      sgstAmount,
      igstPercent,
      igstAmount,
      tdsPercent: numTdsPercent,
      tdsAmount,
      previousBillsPaid: previousBillsTotal,
      netPayable,
      status: 'Submitted',
      paidDate: null
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update RA Bill payment status
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status, paidDate } = req.body;
    const updated = await RABill.findByIdAndUpdate(req.params.id, {
      status,
      paidDate: status === 'Paid' ? (paidDate || new Date().toISOString().split('T')[0]) : null
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
