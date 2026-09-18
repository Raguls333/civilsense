import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'civilsense.sqlite');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Indexed column definitions per table for ultra-fast SQL queries
const TABLE_COLUMNS = {
  users: ['id', 'phone', 'role', 'email'],
  projects: ['id', 'status', 'supervisorId'],
  wageCategories: ['id', 'category'],
  attendances: ['id', 'projectId', 'date', 'contractorId'],
  dprs: ['id', 'projectId', 'date'],
  issues: ['id', 'projectId', 'status', 'priority'],
  vendors: ['id', 'category'],
  ledgerEntries: ['id', 'vendorId', 'projectId', 'date', 'type'],
  materials: ['id', 'projectId'],
  materialPurchases: ['id', 'materialId', 'projectId', 'vendorId', 'date'],
  pettyCash: ['id', 'projectId', 'type', 'date'],
  raBills: ['id', 'projectId', 'billNumber'],
  otpCodes: ['phone', 'code', 'expiresAt']
};

class RealDatabase {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.initialized = false;
    this.data = {
      otpCodes: {}
    };
  }

  async init() {
    if (this.initialized) return;

    this.SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      try {
        const fileBuffer = fs.readFileSync(DB_PATH);
        this.db = new this.SQL.Database(fileBuffer);
        console.log(`⚡ [REAL SQLITE DB] Loaded existing database from ${DB_PATH}`);
      } catch (err) {
        console.warn(`[REAL SQLITE DB] Creating fresh database: ${err.message}`);
        this.db = new this.SQL.Database();
      }
    } else {
      this.db = new this.SQL.Database();
      console.log(`⚡ [REAL SQLITE DB] Initialized fresh SQLite database at ${DB_PATH}`);
    }

    this._createTables();
    this.save();
    this.initialized = true;
  }

  _createTables() {
    // Create each table with its indexed primary columns and full data payload
    for (const [table, cols] of Object.entries(TABLE_COLUMNS)) {
      const colDefs = cols.map(col => {
        if (col === 'id' || col === 'phone' && table === 'otpCodes') {
          return `${col} TEXT PRIMARY KEY`;
        }
        if (col === 'expiresAt') {
          return `${col} INT`;
        }
        return `${col} TEXT`;
      });

      colDefs.push('data TEXT NOT NULL');
      colDefs.push('createdAt TEXT');
      colDefs.push('updatedAt TEXT');

      const sql = `CREATE TABLE IF NOT EXISTS ${table} (${colDefs.join(', ')});`;
      this.db.run(sql);

      // Create indexes for non-primary indexed columns
      for (const col of cols) {
        if (col !== 'id' && !(col === 'phone' && table === 'otpCodes')) {
          this.db.run(`CREATE INDEX IF NOT EXISTS idx_${table}_${col} ON ${table}(${col});`);
        }
      }
    }
  }

  save() {
    try {
      if (!this.db) return;
      const data = this.db.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (err) {
      console.error('Failed to write civilsense.sqlite database file:', err);
    }
  }

  query(sql, params = []) {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  queryOne(sql, params = []) {
    const rows = this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  getCollection(tableName) {
    const self = this;
    const knownCols = TABLE_COLUMNS[tableName] || ['id'];

    const parseRow = (row) => {
      if (!row || !row.data) return null;
      try {
        const parsed = JSON.parse(row.data);
        if (!parsed._id && parsed.id) parsed._id = parsed.id;
        return parsed;
      } catch (e) {
        return null;
      }
    };

    return {
      find: async (query = {}) => {
        const conditions = [];
        const params = [];
        const postFilters = [];

        for (const [k, v] of Object.entries(query)) {
          if (v === undefined) continue;
          if (knownCols.includes(k) || (k === '_id' && knownCols.includes('id'))) {
            const colName = k === '_id' ? 'id' : k;
            conditions.push(`${colName} = ?`);
            params.push(v);
          } else {
            postFilters.push([k, v]);
          }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const rows = self.query(`SELECT data FROM ${tableName} ${whereClause} ORDER BY rowid DESC`, params);
        
        let docs = rows.map(parseRow).filter(Boolean);

        // Apply any remaining in-memory filters for non-indexed fields
        if (postFilters.length > 0) {
          docs = docs.filter(item => {
            return postFilters.every(([k, v]) => {
              if (Array.isArray(item[k])) {
                return item[k].includes(v);
              }
              return item[k] === v;
            });
          });
        }

        return docs;
      },

      findOne: async (query = {}) => {
        const results = await self.getCollection(tableName).find(query);
        return results.length > 0 ? results[0] : null;
      },

      findById: async (id) => {
        const row = self.queryOne(`SELECT data FROM ${tableName} WHERE id = ? LIMIT 1`, [id]);
        return parseRow(row);
      },

      create: async (rawDoc) => {
        const id = rawDoc.id || rawDoc._id || `id_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
        const doc = {
          ...rawDoc,
          id,
          _id: id,
          createdAt: rawDoc.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const colsToInsert = ['id', 'data', 'createdAt', 'updatedAt'];
        const values = [id, JSON.stringify(doc), doc.createdAt, doc.updatedAt];

        for (const col of knownCols) {
          if (col !== 'id' && doc[col] !== undefined) {
            colsToInsert.push(col);
            values.push(String(doc[col]));
          }
        }

        const placeholders = colsToInsert.map(() => '?').join(', ');
        const sql = `INSERT OR REPLACE INTO ${tableName} (${colsToInsert.join(', ')}) VALUES (${placeholders});`;
        
        self.db.run(sql, values);
        self.save();

        return doc;
      },

      findByIdAndUpdate: async (id, updates, options = {}) => {
        const existing = await self.getCollection(tableName).findById(id);
        if (!existing) return null;

        const merged = {
          ...existing,
          ...updates,
          id,
          updatedAt: new Date().toISOString()
        };

        const updateCols = ['data = ?', 'updatedAt = ?'];
        const values = [JSON.stringify(merged), merged.updatedAt];

        for (const col of knownCols) {
          if (col !== 'id' && merged[col] !== undefined) {
            updateCols.push(`${col} = ?`);
            values.push(String(merged[col]));
          }
        }

        values.push(id);
        const sql = `UPDATE ${tableName} SET ${updateCols.join(', ')} WHERE id = ?;`;
        
        self.db.run(sql, values);
        self.save();

        return merged;
      },

      findByIdAndDelete: async (id) => {
        self.db.run(`DELETE FROM ${tableName} WHERE id = ?;`, [id]);
        self.save();
        return true;
      },

      countDocuments: async (query = {}) => {
        const results = await self.getCollection(tableName).find(query);
        return results.length;
      },

      replaceData: async (items) => {
        self.db.run(`DELETE FROM ${tableName};`);
        for (const item of items) {
          await self.getCollection(tableName).create(item);
        }
        self.save();
      }
    };
  }
}

export const realDb = new RealDatabase();
