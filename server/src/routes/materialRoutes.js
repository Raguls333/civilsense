import express from 'express';
import { Material, MaterialPurchase, Vendor, LedgerEntry } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET all stock materials for a project
router.get('/', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { projectId } : {};
    const materials = await Material.find(query);

    // Enrich with low stock boolean
    const enriched = materials.map(m => ({
      ...m,
      isLowStock: Number(m.stockQty) <= Number(m.lowStockThreshold)
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new stock item
router.post('/', requireAuth, async (req, res) => {
  try {
    const { projectId, name, category, unit, stockQty = 0, lowStockThreshold = 10, unitCost = 0 } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ error: 'Material name and unit are required.' });
    }

    const created = await Material.create({
      projectId: projectId || 'proj_1',
      name,
      category: category || 'Civil',
      unit,
      stockQty: Number(stockQty),
      lowStockThreshold: Number(lowStockThreshold),
      unitCost: Number(unitCost),
      lastUpdated: new Date().toISOString().split('T')[0]
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET material purchase history
router.get('/purchases', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { projectId } : {};
    const purchases = await MaterialPurchase.find(query);
    purchases.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST record material purchase (auto updates stock + posts credit to vendor ledger)
router.post('/purchases', requireAuth, async (req, res) => {
  try {
    const {
      projectId,
      materialId,
      materialName,
      vendorId,
      qty,
      unit,
      unitPrice,
      invoiceNo,
      date,
      category,
      paymentStatus = 'Pending'
    } = req.body;

    const numQty = Number(qty) || 0;
    const numPrice = Number(unitPrice) || 0;
    const totalCost = numQty * numPrice;

    const vendor = vendorId ? await Vendor.findById(vendorId) : null;
    const vendorName = vendor ? vendor.name : 'Direct Cash Purchase';

    // 1. Record purchase
    const purchase = await MaterialPurchase.create({
      projectId: projectId || 'proj_1',
      materialId,
      materialName,
      vendorId: vendorId || null,
      vendorName,
      qty: numQty,
      unit: unit || 'Units',
      unitPrice: numPrice,
      totalCost,
      invoiceNo: invoiceNo || 'INV-' + Date.now().toString().slice(-6),
      date: date || new Date().toISOString().split('T')[0],
      category: category || 'Civil',
      paymentStatus
    });

    // 2. Update stock quantity if existing material
    if (materialId) {
      const mat = await Material.findById(materialId);
      if (mat) {
        const newStock = Number(mat.stockQty || 0) + numQty;
        await Material.findByIdAndUpdate(materialId, {
          stockQty: newStock,
          unitCost: numPrice || mat.unitCost,
          lastUpdated: date || new Date().toISOString().split('T')[0]
        });
      }
    }

    // 3. If vendor is linked and unpaid/partial, auto-create credit entry in Vendor Ledger
    if (vendor && paymentStatus !== 'Paid') {
      const newBalance = Number(vendor.balance || 0) + totalCost;
      await Vendor.findByIdAndUpdate(vendor.id, { balance: newBalance });

      await LedgerEntry.create({
        partyId: vendor.id,
        partyName: vendor.name,
        projectId: projectId || 'proj_1',
        date: date || new Date().toISOString().split('T')[0],
        description: `Material Supply: ${numQty} ${unit} of ${materialName}`,
        debit: 0,
        credit: totalCost,
        balanceAfter: newBalance,
        type: 'Invoice',
        paymentMode: 'Credit',
        reference: invoiceNo || purchase.id
      });
    }

    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
