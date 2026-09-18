import express from 'express';
import { Vendor, LedgerEntry } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all vendors / contractors with live balance
router.get('/vendors', requireAuth, async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET overall summary statistics
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { projectId } : {};
    
    const vendors = await Vendor.find();
    const entries = await LedgerEntry.find(query);

    const totalOutstanding = vendors.reduce((acc, v) => acc + Math.max(0, Number(v.balance) || 0), 0);
    const vendorsWithDuesCount = vendors.filter(v => Number(v.balance) > 0).length;
    const totalPaymentsPaid = entries.reduce((acc, e) => acc + (Number(e.debit) || 0), 0);
    const totalInvoicesBilled = entries.reduce((acc, e) => acc + (Number(e.credit) || 0), 0);

    res.json({
      totalVendors: vendors.length,
      vendorsWithDuesCount,
      totalOutstanding,
      totalPaymentsPaid,
      totalInvoicesBilled
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create vendor / contractor
router.post('/vendors', requireAuth, async (req, res) => {
  try {
    const { name, type, category, contactPerson, phone, gstNumber, upiId, address, balance = 0, projectId } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Vendor name and phone are required.' });
    }

    const numBal = Number(balance) || 0;

    const created = await Vendor.create({
      name,
      type: type || 'Material Supplier',
      category: category || 'General Supplies',
      contactPerson: contactPerson || name,
      phone,
      gstNumber: gstNumber || '',
      upiId: upiId || '',
      address: address || '',
      balance: numBal
    });

    // If opening balance > 0, log an initial ledger entry so statement is completely traceable
    if (numBal > 0) {
      await LedgerEntry.create({
        partyId: created.id,
        partyName: created.name,
        projectId: projectId || 'proj_1',
        date: new Date().toISOString().split('T')[0],
        description: 'Opening Balance (Previous Books)',
        debit: 0,
        credit: numBal,
        balanceAfter: numBal,
        type: 'Invoice',
        paymentMode: 'Opening Balance',
        reference: 'OPEN-BAL-' + Date.now().toString().slice(-4)
      });
    }

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update vendor profile
router.put('/vendors/:id', requireAuth, async (req, res) => {
  try {
    const { name, type, category, contactPerson, phone, gstNumber, upiId, address } = req.body;
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });

    const updated = await Vendor.findByIdAndUpdate(req.params.id, {
      ...(name && { name }),
      ...(type && { type }),
      ...(category && { category }),
      ...(contactPerson && { contactPerson }),
      ...(phone && { phone }),
      gstNumber: gstNumber !== undefined ? gstNumber : vendor.gstNumber,
      upiId: upiId !== undefined ? upiId : vendor.upiId,
      address: address !== undefined ? address : vendor.address
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE vendor & cascade entries
router.delete('/vendors/:id', requireAuth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });

    await Vendor.findByIdAndDelete(req.params.id);

    // Cascade delete vendor ledger entries
    const entries = await LedgerEntry.find({ partyId: req.params.id });
    for (const ent of entries) {
      await LedgerEntry.findByIdAndDelete(ent.id);
    }

    res.json({ success: true, message: 'Vendor and associated records removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET running ledger entries for a party or project
router.get('/entries', requireAuth, async (req, res) => {
  try {
    const { partyId, projectId, type, search } = req.query;
    const query = {};
    if (partyId) query.partyId = partyId;
    if (projectId) query.projectId = projectId;

    let entries = await LedgerEntry.find(query);

    if (type && type !== 'All') {
      entries = entries.filter(e => e.type === type);
    }

    if (search) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.reference && e.reference.toLowerCase().includes(q)) ||
        (e.paymentMode && e.paymentMode.toLowerCase().includes(q))
      );
    }

    entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add manual ledger entry (Payment Debit or Invoice Credit)
router.post('/entries', requireAuth, async (req, res) => {
  try {
    const {
      partyId,
      projectId,
      date,
      description,
      debit = 0,
      credit = 0,
      type,
      paymentMode,
      reference
    } = req.body;

    if (!partyId) {
      return res.status(400).json({ error: 'Party ID (vendor/contractor) is required.' });
    }

    const vendor = await Vendor.findById(partyId);
    if (!vendor) return res.status(404).json({ error: 'Vendor/Contractor not found.' });

    const numDebit = Number(debit) || 0;
    const numCredit = Number(credit) || 0;

    // In contractor ledgers: Credit increases outstanding dues (supplies/bills), Debit reduces dues (payments made)
    const currentBalance = Number(vendor.balance) || 0;
    const newBalance = currentBalance + numCredit - numDebit;

    // Update vendor balance
    await Vendor.findByIdAndUpdate(partyId, { balance: newBalance });

    // Record ledger entry
    const entry = await LedgerEntry.create({
      partyId,
      partyName: vendor.name,
      projectId: projectId || 'proj_1',
      date: date || new Date().toISOString().split('T')[0],
      description: description || (numDebit > 0 ? 'Payment to vendor' : 'Supply invoice'),
      debit: numDebit,
      credit: numCredit,
      balanceAfter: newBalance,
      type: type || (numDebit > 0 ? 'Payment' : 'Invoice'),
      paymentMode: paymentMode || (numDebit > 0 ? 'Bank Transfer' : 'Credit'),
      reference: reference || 'REF-' + Date.now().toString().slice(-6)
    });

    res.status(201).json({ entry, updatedBalance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE void/delete ledger entry and adjust balance
router.delete('/entries/:id', requireAuth, async (req, res) => {
  try {
    const entry = await LedgerEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Ledger entry not found.' });

    const vendor = await Vendor.findById(entry.partyId);
    let newBalance = vendor ? Number(vendor.balance) || 0 : 0;

    if (vendor) {
      // Revert entry effect
      newBalance = newBalance - (Number(entry.credit) || 0) + (Number(entry.debit) || 0);
      await Vendor.findByIdAndUpdate(vendor.id, { balance: newBalance });
    }

    await LedgerEntry.findByIdAndDelete(req.params.id);

    // Recalculate running balanceAfter for this party's remaining entries in chronological order
    const partyEntries = await LedgerEntry.find({ partyId: entry.partyId });
    partyEntries.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    let running = 0;
    for (const item of partyEntries) {
      running = running + (Number(item.credit) || 0) - (Number(item.debit) || 0);
      await LedgerEntry.findByIdAndUpdate(item.id, { balanceAfter: running });
    }

    res.json({ success: true, message: 'Ledger entry voided successfully', updatedBalance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
