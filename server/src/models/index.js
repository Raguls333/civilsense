import { realDb } from '../db/realDb.js';

export const User = realDb.getCollection('users');
export const Project = realDb.getCollection('projects');
export const WageCategory = realDb.getCollection('wageCategories');
export const Attendance = realDb.getCollection('attendances');
export const DPR = realDb.getCollection('dprs');
export const Issue = realDb.getCollection('issues');
export const Vendor = realDb.getCollection('vendors');
export const LedgerEntry = realDb.getCollection('ledgerEntries');
export const Material = realDb.getCollection('materials');
export const MaterialPurchase = realDb.getCollection('materialPurchases');
export const PettyCash = realDb.getCollection('pettyCash');
export const RABill = realDb.getCollection('raBills');

export default {
  User,
  Project,
  WageCategory,
  Attendance,
  DPR,
  Issue,
  Vendor,
  LedgerEntry,
  Material,
  MaterialPurchase,
  PettyCash,
  RABill
};
