import express from 'express';
import { Vendor, Project, Attendance, DPR } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to format Indian currency in text
const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
};

// Generate WhatsApp Notification payloads and direct wa.me link
router.post('/whatsapp-template', requireAuth, async (req, res) => {
  try {
    const { type, vendorId, projectId, customPhone } = req.body;

    let phone = customPhone || '';
    let messageText = '';
    let templateName = '';
    let parameters = {};

    if (type === 'vendor_payment_reminder') {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });

      phone = (vendor.phone || '').replace(/[^0-9]/g, '');
      templateName = 'vendor_payment_status';
      parameters = {
        vendorName: vendor.name,
        balance: formatINR(vendor.balance),
        upiId: vendor.upiId || 'Not provided'
      };

      messageText = `🏗️ *CivilSense Payment Update*\n\n` +
        `Dear *${vendor.name}*,\n` +
        `This is regarding the outstanding ledger balance of *${formatINR(vendor.balance)}* with Sharma & Sons Infra Buildcon.\n\n` +
        `💳 *UPI ID:* ${vendor.upiId || 'N/A'}\n` +
        `Please share your latest bank account statement if any recent payments were missed.\n\n` +
        `Regards,\nAccounts Department\nCivilSense Project Management`;
    } 
    else if (type === 'daily_attendance_summary') {
      const project = await Project.findById(projectId);
      const today = new Date().toISOString().split('T')[0];
      const attendances = await Attendance.find({ projectId, date: today });

      let totalWorkers = 0;
      let totalWage = 0;
      let masons = 0;
      let helpers = 0;
      let barBenders = 0;

      attendances.forEach(a => {
        totalWorkers += (a.totalWorkers || 0);
        totalWage += (a.totalWage || 0);
        (a.entries || []).forEach(e => {
          const cat = (e.category || '').toLowerCase();
          if (cat.includes('mason')) masons += e.count;
          else if (cat.includes('helper')) helpers += e.count;
          else if (cat.includes('bar')) barBenders += e.count;
        });
      });

      templateName = 'daily_labour_summary';
      parameters = {
        projectName: project?.name || 'Site',
        date: today,
        totalWorkers,
        totalWage: formatINR(totalWage),
        supervisor: req.user.name
      };

      messageText = `👷‍♂️ *Daily Labour Attendance Summary*\n\n` +
        `📍 *Project:* ${project?.name || 'Site'}\n` +
        `📅 *Date:* ${today}\n` +
        `👮 *Logged by:* ${req.user.name}\n\n` +
        `👥 *Total Workers on Site:* ${totalWorkers}\n` +
        `• Masons: ${masons}\n` +
        `• Helpers: ${helpers}\n` +
        `• Bar Benders / Fitters: ${barBenders}\n\n` +
        `💰 *Estimated Wage Rollup:* ${formatINR(totalWage)}\n` +
        `Verification: GPS & Photo check-in completed on CivilSense.\n\n` +
        `_Reported via CivilSense Construction OS_`;
    }
    else if (type === 'client_progress_update') {
      const project = await Project.findById(projectId);
      const dprs = await DPR.find({ projectId });
      const latestDpr = dprs[0];

      templateName = 'client_milestone_update';
      const portalUrl = `${req.protocol}://${req.get('host')}/#/client-portal/${project?.shareToken || ''}`;

      parameters = {
        clientName: project?.client || 'Valued Client',
        projectName: project?.name || 'Your Project',
        completion: `${project?.completionPercentage || 0}%`,
        portalUrl
      };

      messageText = `🏢 *Site Progress Update*\n\n` +
        `Dear *${project?.client || 'Sir/Madam'}*,\n` +
        `Greetings from Sharma & Sons Infra Buildcon!\n\n` +
        `We are pleased to update that *${project?.name}* has achieved *${project?.completionPercentage}% overall completion*.\n\n` +
        `🔨 *Recent Site Works:*\n${latestDpr ? latestDpr.workCompleted.slice(0, 180) + '...' : 'RCC columns and reinforcement work ongoing.'}\n\n` +
        `📸 *View Verified Site Photos & Live Dashboard (No Login Needed):*\n` +
        `${portalUrl}\n\n` +
        `Thank you for building with us!`;
    }

    const encodedText = encodeURIComponent(messageText);
    const waLink = phone ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;

    // Cloud API standard structure
    const cloudApiPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone || "91XXXXXXXXXX",
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: Object.entries(parameters).map(([k, v]) => ({
              type: "text",
              text: String(v)
            }))
          }
        ]
      }
    };

    res.json({
      type,
      phone,
      messageText,
      waLink,
      cloudApiPayload
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
