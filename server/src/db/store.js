import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Store {
  constructor() {
    this.data = {
      users: [],
      projects: [],
      wageCategories: [],
      attendances: [],
      dprs: [],
      issues: [],
      vendors: [],
      ledgerEntries: [],
      materials: [],
      materialPurchases: [],
      pettyCash: [],
      raBills: [],
      otpCodes: {} // phone -> { code, expiresAt }
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      }
    } catch (err) {
      console.warn('Could not read existing store.json, using fresh store.', err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save store.json:', err);
    }
  }

  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    const self = this;
    const getItems = () => self.data[name] || [];

    return {
      find: async (query = {}) => {
        return getItems().filter(item => {
          return Object.entries(query).every(([k, v]) => {
            if (v === undefined) return true;
            if (Array.isArray(item[k])) {
              return item[k].includes(v);
            }
            return item[k] === v;
          });
        });
      },

      findOne: async (query = {}) => {
        return getItems().find(item => {
          return Object.entries(query).every(([k, v]) => {
            if (v === undefined) return true;
            return item[k] === v;
          });
        }) || null;
      },

      findById: async (id) => {
        return getItems().find(item => item.id === id || item._id === id) || null;
      },

      create: async (doc) => {
        const id = doc.id || doc._id || 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        const newDoc = {
          ...doc,
          id,
          _id: id,
          createdAt: doc.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        getItems().push(newDoc);
        self.save();
        return newDoc;
      },

      findByIdAndUpdate: async (id, updates, options = {}) => {
        const items = getItems();
        const idx = items.findIndex(item => item.id === id || item._id === id);
        if (idx === -1) return null;
        items[idx] = {
          ...items[idx],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        self.save();
        return items[idx];
      },

      findByIdAndDelete: async (id) => {
        const items = getItems();
        const idx = items.findIndex(item => item.id === id || item._id === id);
        if (idx === -1) return false;
        items.splice(idx, 1);
        self.save();
        return true;
      },

      countDocuments: async (query = {}) => {
        const results = await self.getCollection(name).find(query);
        return results.length;
      },

      replaceData: (newData) => {
        self.data[name] = newData;
        self.save();
      }
    };
  }
}

export const dbStore = new Store();
