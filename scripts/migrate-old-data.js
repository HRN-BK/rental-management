#!/usr/bin/env node

/**
 * Migration script: Đồng bộ dữ liệu từ format JSON cũ lên Supabase
 * Hỗ trợ: backup, validation, batch processing, resume, rollback
 * 
 * Usage:
 * node scripts/migrate-old-data.js --help
 * node scripts/migrate-old-data.js --dry-run
 * node scripts/migrate-old-data.js --input data/file.json --batch-size 100
 */

const fs = require('fs-extra');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { z } = require('zod');
const { format } = require('date-fns');
const { nanoid } = require('nanoid');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const pLimit = require('p-limit');
require('dotenv').config({ path: '.env.local' });

// =====================================
// CONFIGURATION & SETUP
// =====================================

const CONFIG = {
  batchSize: 200,
  concurrency: 4,
  retryAttempts: 3,
  retryDelay: 1000, // ms
  backoffMultiplier: 2,
};

// CLI Arguments
const argv = yargs(hideBin(process.argv))
  .option('dry-run', {
    type: 'boolean',
    description: 'Chạy thử không ghi database',
    default: false
  })
  .option('input', {
    type: 'string',
    description: 'Đường dẫn file JSON input',
    default: 'data/65aa580eeefd3f1119b3c04d0db03951_rental-data-2025-09-11.json'
  })
  .option('batch-size', {
    type: 'number',
    description: 'Số bản ghi mỗi batch',
    default: CONFIG.batchSize
  })
  .option('concurrency', {
    type: 'number', 
    description: 'Số batch xử lý đồng thời',
    default: CONFIG.concurrency
  })
  .option('resume-from', {
    type: 'string',
    choices: ['properties', 'rooms', 'tenants', 'contracts'],
    description: 'Tiếp tục từ bước'
  })
  .option('skip-backup', {
    type: 'boolean',
    description: 'Bỏ qua backup',
    default: false
  })
  .option('schema', {
    type: 'string',
    description: 'Database schema',
    default: 'public'
  })
  .help()
  .argv;

// Global state
let logger, supabase, migrationId;
let dbIndexes = {}; // For deduplication
let idMappings = {}; // old -> new ID mappings
let state = {}; // Migration state for resume

// =====================================
// LOGGING SETUP
// =====================================

function createLogger() {
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const logFile = path.join(__dirname, '../logs', `migrate-${timestamp}.log`);
  
  fs.ensureDirSync(path.dirname(logFile));
  
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  return {
    info: (msg, data = {}) => {
      const entry = { level: 'info', timestamp: new Date().toISOString(), msg, ...data };
      console.log(`[INFO] ${msg}`, Object.keys(data).length ? data : '');
      logStream.write(JSON.stringify(entry) + '\n');
    },
    warn: (msg, data = {}) => {
      const entry = { level: 'warn', timestamp: new Date().toISOString(), msg, ...data };
      console.warn(`[WARN] ${msg}`, Object.keys(data).length ? data : '');
      logStream.write(JSON.stringify(entry) + '\n');
    },
    error: (msg, data = {}) => {
      const entry = { level: 'error', timestamp: new Date().toISOString(), msg, ...data };
      console.error(`[ERROR] ${msg}`, Object.keys(data).length ? data : '');
      logStream.write(JSON.stringify(entry) + '\n');
    },
    close: () => logStream.end()
  };
}

// =====================================
// VALIDATION SCHEMAS
// =====================================

const HouseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  address: z.string().min(1),
  notes: z.string().optional(),
  image: z.string().optional()
});

const RoomSchema = z.object({
  id: z.string(),
  houseId: z.string(),
  name: z.string().min(1),
  price: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).refine(v => v >= 0),
  status: z.enum(['available', 'occupied', 'maintenance']),
  area: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional()
});

const TenantSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  phone: z.string().optional(),
  idCard: z.string().optional(),
  roomId: z.string().optional(),
  rentStartDay: z.union([z.number(), z.string().transform(v => parseInt(v) || null)]).optional(),
  rentEndDay: z.union([z.number(), z.string().transform(v => parseInt(v) || null)]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional()
});

const OldDataSchema = z.object({
  houses: z.array(HouseSchema),
  rooms: z.array(RoomSchema),
  tenants: z.array(TenantSchema)
});

// =====================================
// UTILITY FUNCTIONS
// =====================================

function sanitizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/[^\d+]/g, '').trim() || null;
}

function sanitizeEmail(email) {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  return clean.includes('@') ? clean : null;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff(fn, attempts = CONFIG.retryAttempts) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        const delay = CONFIG.retryDelay * Math.pow(CONFIG.backoffMultiplier, i);
        logger.warn(`Retry ${i + 1}/${attempts} after ${delay}ms`, { error: error.message });
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// =====================================
// DATABASE OPERATIONS
// =====================================

async function initSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  }

  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: argv.schema }
  });

  // Test connection
  const { error } = await supabase.from('properties').select('id').limit(1);
  if (error && !error.message.includes('does not exist')) {
    throw new Error(`Cannot connect to Supabase: ${error.message}`);
  }

  logger.info('Connected to Supabase successfully');
}

async function introspectSchema() {
  logger.info('Introspecting database schema...');
  
  const tables = ['properties', 'rooms', 'tenants', 'rental_contracts'];
  const schema = {};
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0); // Only get column info
    
    if (error) {
      logger.warn(`Table ${table} does not exist or is not accessible`, { error: error.message });
      schema[table] = { exists: false };
    } else {
      schema[table] = { exists: true };
    }
  }
  
  logger.info('Schema introspection completed', schema);
  return schema;
}

async function backupExistingData() {
  if (argv.skipBackup) {
    logger.info('Skipping backup as requested');
    return;
  }

  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const backupDir = path.join(__dirname, '../backups', timestamp);
  fs.ensureDirSync(backupDir);

  const tables = ['properties', 'rooms', 'tenants', 'rental_contracts'];
  const manifest = { timestamp, tables: {} };

  for (const table of tables) {
    logger.info(`Backing up ${table}...`);
    try {
      const { data, error } = await supabase.from(table).select('*');
      
      if (error && error.message.includes('does not exist')) {
        logger.warn(`Table ${table} does not exist, skipping backup`);
        continue;
      }
      
      if (error) throw error;

      const backupFile = path.join(backupDir, `${table}.json`);
      await fs.writeJson(backupFile, data, { spaces: 2 });
      
      manifest.tables[table] = { 
        count: data.length, 
        file: `${table}.json` 
      };
      
      logger.info(`Backed up ${data.length} records from ${table}`);
    } catch (error) {
      logger.error(`Failed to backup ${table}`, { error: error.message });
    }
  }

  await fs.writeJson(path.join(backupDir, 'manifest.json'), manifest, { spaces: 2 });
  logger.info(`Backup completed in ${backupDir}`);
}

async function buildDbIndexes() {
  logger.info('Building database indexes for deduplication...');
  
  // Properties index
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name, address, district, city');
  
  dbIndexes.properties = new Map();
  if (properties) {
    properties.forEach(p => {
      const naturalKey = `${p.name}|${p.address}`.toLowerCase();
      dbIndexes.properties.set(naturalKey, p);
    });
  }

  // Rooms index
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, property_id, room_number');
    
  dbIndexes.rooms = new Map();
  if (rooms) {
    rooms.forEach(r => {
      const naturalKey = `${r.property_id}|${r.room_number}`.toLowerCase();
      dbIndexes.rooms.set(naturalKey, r);
    });
  }

  // Tenants index
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, full_name, phone, email, id_number');
    
  dbIndexes.tenants = new Map();
  if (tenants) {
    tenants.forEach(t => {
      // Index by multiple possible unique keys
      if (t.id_number) {
        dbIndexes.tenants.set(`idcard:${t.id_number}`, t);
      }
      if (t.email) {
        dbIndexes.tenants.set(`email:${t.email}`, t);
      }
      const phoneKey = `phone:${t.phone}|name:${t.full_name}`.toLowerCase();
      dbIndexes.tenants.set(phoneKey, t);
    });
  }

  logger.info('Database indexes built', {
    properties: dbIndexes.properties.size,
    rooms: dbIndexes.rooms.size,
    tenants: dbIndexes.tenants.size
  });
}

async function upsertBatch(table, records, onConflict = null) {
  if (!records.length) return [];

  return retryWithBackoff(async () => {
    let query = supabase.from(table).upsert(records, { ignoreDuplicates: false });
    
    if (onConflict) {
      query = query.select();
    } else {
      query = query.select();
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
}

// =====================================
// DATA TRANSFORMATION & MIGRATION
// =====================================

function transformHousesToProperties(houses) {
  logger.info(`Transforming ${houses.length} houses to properties...`);
  
  const properties = houses.map(house => {
    // Check for existing property
    const naturalKey = `${house.name}|${house.address}`.toLowerCase();
    const existing = dbIndexes.properties.get(naturalKey);
    
    if (existing) {
      logger.info(`Property already exists: ${house.name}`, { existingId: existing.id });
      idMappings.houses = idMappings.houses || {};
      idMappings.houses[house.id] = existing.id;
      return null; // Skip insertion
    }

    return {
      name: house.name.trim(),
      address: house.address.trim(),
      district: null, // Not in old data
      city: 'TP.HCM', // Default from old data context
      description: house.notes || null,
      status: 'active',
      // Computed fields will be handled by DB triggers/functions
      total_rooms: 0,
      occupied_rooms: 0,
      available_rooms: 0,
      occupancy_percentage: 0
    };
  }).filter(Boolean);

  return properties;
}

function transformRoomsToRooms(rooms) {
  logger.info(`Transforming ${rooms.length} rooms...`);
  
  const transformedRooms = [];
  const orphanRooms = [];

  for (const room of rooms) {
    const propertyId = idMappings.houses?.[room.houseId];
    
    if (!propertyId) {
      orphanRooms.push(room);
      continue;
    }

    // Check for existing room
    const naturalKey = `${propertyId}|${room.name}`.toLowerCase();
    const existing = dbIndexes.rooms.get(naturalKey);
    
    if (existing) {
      logger.info(`Room already exists: ${room.name}`, { existingId: existing.id });
      idMappings.rooms = idMappings.rooms || {};
      idMappings.rooms[room.id] = existing.id;
      continue;
    }

    transformedRooms.push({
      property_id: propertyId,
      room_number: room.name.trim(),
      floor: null, // Not in old data
      area_sqm: room.area ? parseInt(room.area) || null : null,
      rent_amount: room.price,
      deposit_amount: room.price * 2, // Default: 2 months rent
      utilities: ['electricity', 'water', 'internet'], // Default utilities
      status: room.status === 'occupied' ? 'occupied' : 'available',
      description: room.description || null,
      images: room.image ? [room.image] : null
    });
  }

  if (orphanRooms.length > 0) {
    logger.warn(`Found ${orphanRooms.length} orphan rooms (no matching property)`, {
      orphanIds: orphanRooms.map(r => r.id)
    });
  }

  return transformedRooms;
}

function transformTenantsToTenants(tenants) {
  logger.info(`Transforming ${tenants.length} tenants...`);
  
  const transformedTenants = [];
  
  for (const tenant of tenants) {
    // Check for existing tenant
    const phoneKey = `phone:${tenant.phone}|name:${tenant.name}`.toLowerCase();
    const existing = dbIndexes.tenants.get(phoneKey) || 
                    (tenant.idCard && dbIndexes.tenants.get(`idcard:${tenant.idCard}`));
    
    if (existing) {
      logger.info(`Tenant already exists: ${tenant.name}`, { existingId: existing.id });
      idMappings.tenants = idMappings.tenants || {};
      idMappings.tenants[tenant.id] = existing.id;
      continue;
    }

    transformedTenants.push({
      full_name: tenant.name.trim(),
      phone: sanitizePhone(tenant.phone),
      email: sanitizeEmail(null), // Not in old data
      id_number: tenant.idCard || null,
      birth_date: null, // Not in old data
      address: null, // Not in old data
      occupation: null, // Not in old data
      emergency_contact: null, // Not in old data
      emergency_phone: null, // Not in old data
      notes: tenant.notes || null
    });
  }

  return transformedTenants;
}

function buildRentalContracts(oldTenants) {
  logger.info(`Building rental contracts from ${oldTenants.length} tenant relationships...`);
  
  const contracts = [];
  const orphanContracts = [];

  for (const tenant of oldTenants) {
    if (!tenant.roomId) continue; // Skip tenants without room assignment

    const tenantId = idMappings.tenants?.[tenant.id];
    const roomId = idMappings.rooms?.[tenant.roomId];

    if (!tenantId || !roomId) {
      orphanContracts.push({ tenantName: tenant.name, reason: !tenantId ? 'missing tenant' : 'missing room' });
      continue;
    }

    // Find room to get property_id
    const room = Object.entries(idMappings.rooms).find(([oldId, newId]) => newId === roomId);
    const oldRoom = room ? state.oldData?.rooms.find(r => r.id === room[0]) : null;
    const propertyId = oldRoom ? idMappings.houses?.[oldRoom.houseId] : null;

    if (!propertyId) {
      orphanContracts.push({ tenantName: tenant.name, reason: 'missing property' });
      continue;
    }

    // Calculate rent amount - use room price from old data
    const oldRoomData = state.oldData?.rooms.find(r => r.id === tenant.roomId);
    const rentAmount = oldRoomData?.price || 0;

    contracts.push({
      room_id: roomId,
      tenant_id: tenantId,
      start_date: tenant.startDate ? parseDate(tenant.startDate) : new Date().toISOString().split('T')[0],
      end_date: tenant.endDate ? parseDate(tenant.endDate) : null,
      monthly_rent: rentAmount,
      deposit_amount: rentAmount * 2, // Default: 2 months
      renewal_count: 0,
      status: 'active'
    });
  }

  if (orphanContracts.length > 0) {
    logger.warn(`Could not create ${orphanContracts.length} contracts`, { orphanContracts });
  }

  return contracts;
}

// =====================================
// MIGRATION STEPS
// =====================================

async function migrateProperties(houses) {
  if (argv.resumeFrom && ['rooms', 'tenants', 'contracts'].includes(argv.resumeFrom)) {
    logger.info('Skipping properties migration (resume)');
    return;
  }

  logger.info('=== MIGRATING PROPERTIES ===');
  
  const properties = transformHousesToProperties(houses);
  
  if (argv.dryRun) {
    logger.info(`[DRY RUN] Would insert ${properties.length} properties`);
    // In dry-run, simulate ID mappings for downstream processing
    idMappings.houses = idMappings.houses || {};
    houses.forEach((house, index) => {
      if (!idMappings.houses[house.id]) {
        idMappings.houses[house.id] = `fake-property-${index + 1}`;
      }
    });
    return;
  }

  if (properties.length === 0) {
    logger.info('No new properties to insert');
    return;
  }

  // Process in batches
  const limit = pLimit(argv.concurrency);
  const batches = [];
  
  for (let i = 0; i < properties.length; i += argv.batchSize) {
    const batch = properties.slice(i, i + argv.batchSize);
    batches.push(limit(() => upsertBatch('properties', batch)));
  }

  const results = await Promise.all(batches);
  const inserted = results.flat();

  // Build ID mappings for houses -> properties
  idMappings.houses = idMappings.houses || {};
  let houseIndex = 0;
  
  for (const house of houses) {
    if (!idMappings.houses[house.id]) { // Only if not already mapped
      const property = inserted[houseIndex++];
      if (property) {
        idMappings.houses[house.id] = property.id;
      }
    }
  }

  logger.info(`Properties migration completed`, {
    inserted: inserted.length,
    mappings: Object.keys(idMappings.houses).length
  });

  state.completedSteps = state.completedSteps || [];
  state.completedSteps.push('properties');
}

async function migrateRooms(rooms) {
  if (argv.resumeFrom && ['tenants', 'contracts'].includes(argv.resumeFrom)) {
    logger.info('Skipping rooms migration (resume)');
    return;
  }

  logger.info('=== MIGRATING ROOMS ===');
  
  const transformedRooms = transformRoomsToRooms(rooms);
  
  if (argv.dryRun) {
    logger.info(`[DRY RUN] Would insert ${transformedRooms.length} rooms`);
    // In dry-run, simulate ID mappings for downstream processing
    idMappings.rooms = idMappings.rooms || {};
    let roomIndex = 0;
    rooms.forEach((room) => {
      if (!idMappings.rooms[room.id] && idMappings.houses[room.houseId]) {
        idMappings.rooms[room.id] = `fake-room-${roomIndex + 1}`;
        roomIndex++;
      }
    });
    return;
  }

  if (transformedRooms.length === 0) {
    logger.info('No new rooms to insert');
    return;
  }

  // Process in batches
  const limit = pLimit(argv.concurrency);
  const batches = [];
  
  for (let i = 0; i < transformedRooms.length; i += argv.batchSize) {
    const batch = transformedRooms.slice(i, i + argv.batchSize);
    batches.push(limit(() => upsertBatch('rooms', batch)));
  }

  const results = await Promise.all(batches);
  const inserted = results.flat();

  // Build ID mappings for rooms
  idMappings.rooms = idMappings.rooms || {};
  let roomIndex = 0;
  
  for (const room of rooms) {
    if (!idMappings.rooms[room.id] && idMappings.houses[room.houseId]) {
      const insertedRoom = inserted[roomIndex++];
      if (insertedRoom) {
        idMappings.rooms[room.id] = insertedRoom.id;
      }
    }
  }

  logger.info(`Rooms migration completed`, {
    inserted: inserted.length,
    mappings: Object.keys(idMappings.rooms).length
  });

  state.completedSteps.push('rooms');
}

async function migrateTenants(tenants) {
  if (argv.resumeFrom === 'contracts') {
    logger.info('Skipping tenants migration (resume)');
    return;
  }

  logger.info('=== MIGRATING TENANTS ===');
  
  const transformedTenants = transformTenantsToTenants(tenants);
  
  if (argv.dryRun) {
    logger.info(`[DRY RUN] Would insert ${transformedTenants.length} tenants`);
    // In dry-run, simulate ID mappings for downstream processing
    idMappings.tenants = idMappings.tenants || {};
    let tenantIndex = 0;
    tenants.forEach((tenant) => {
      if (!idMappings.tenants[tenant.id]) {
        idMappings.tenants[tenant.id] = `fake-tenant-${tenantIndex + 1}`;
        tenantIndex++;
      }
    });
    return;
  }

  if (transformedTenants.length === 0) {
    logger.info('No new tenants to insert');
    return;
  }

  // Process in batches
  const limit = pLimit(argv.concurrency);
  const batches = [];
  
  for (let i = 0; i < transformedTenants.length; i += argv.batchSize) {
    const batch = transformedTenants.slice(i, i + argv.batchSize);
    batches.push(limit(() => upsertBatch('tenants', batch)));
  }

  const results = await Promise.all(batches);
  const inserted = results.flat();

  // Build ID mappings for tenants
  idMappings.tenants = idMappings.tenants || {};
  let tenantIndex = 0;
  
  for (const tenant of tenants) {
    if (!idMappings.tenants[tenant.id]) {
      const insertedTenant = inserted[tenantIndex++];
      if (insertedTenant) {
        idMappings.tenants[tenant.id] = insertedTenant.id;
      }
    }
  }

  logger.info(`Tenants migration completed`, {
    inserted: inserted.length,
    mappings: Object.keys(idMappings.tenants).length
  });

  state.completedSteps.push('tenants');
}

async function migrateContracts(tenants) {
  logger.info('=== MIGRATING RENTAL CONTRACTS ===');
  
  const contracts = buildRentalContracts(tenants);
  
  if (argv.dryRun) {
    logger.info(`[DRY RUN] Would insert ${contracts.length} rental contracts`);
    return;
  }

  if (contracts.length === 0) {
    logger.info('No contracts to insert');
    return;
  }

  // Process in batches
  const limit = pLimit(argv.concurrency);
  const batches = [];
  
  for (let i = 0; i < contracts.length; i += argv.batchSize) {
    const batch = contracts.slice(i, i + argv.batchSize);
    batches.push(limit(() => upsertBatch('rental_contracts', batch)));
  }

  const results = await Promise.all(batches);
  const inserted = results.flat();

  logger.info(`Contracts migration completed`, { inserted: inserted.length });
  state.completedSteps.push('contracts');
}

// =====================================
// VALIDATION & REPORTING
// =====================================

async function validateData(data) {
  logger.info('Validating input data...');
  
  try {
    const validated = OldDataSchema.parse(data);
    logger.info('Data validation passed', {
      houses: validated.houses.length,
      rooms: validated.rooms.length,
      tenants: validated.tenants.length
    });
    return validated;
  } catch (error) {
    logger.error('Data validation failed', { error: error.message });
    throw error;
  }
}

async function generateReport() {
  const timestamp = new Date().toISOString();
  const report = {
    migration_id: migrationId,
    timestamp,
    dry_run: argv.dryRun,
    input_file: argv.input,
    completed_steps: state.completedSteps || [],
    id_mappings: {
      houses: Object.keys(idMappings.houses || {}).length,
      rooms: Object.keys(idMappings.rooms || {}).length,
      tenants: Object.keys(idMappings.tenants || {}).length
    },
    config: {
      batch_size: argv.batchSize,
      concurrency: argv.concurrency,
      schema: argv.schema
    }
  };

  const reportFile = path.join(__dirname, '../logs', `migration-report-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`);
  await fs.writeJson(reportFile, report, { spaces: 2 });
  
  logger.info(`Migration report saved to ${reportFile}`);
  return report;
}

async function saveState() {
  const stateFile = path.join(__dirname, '../migrations', 'state.json');
  fs.ensureDirSync(path.dirname(stateFile));
  
  const stateData = {
    migration_id: migrationId,
    timestamp: new Date().toISOString(),
    completed_steps: state.completedSteps || [],
    id_mappings: idMappings
  };
  
  await fs.writeJson(stateFile, stateData, { spaces: 2 });
  logger.info('Migration state saved');
}

async function loadState() {
  const stateFile = path.join(__dirname, '../migrations', 'state.json');
  
  if (await fs.pathExists(stateFile)) {
    const stateData = await fs.readJson(stateFile);
    idMappings = stateData.id_mappings || {};
    state.completedSteps = stateData.completed_steps || [];
    logger.info('Previous migration state loaded', { 
      completedSteps: state.completedSteps,
      mappingsCount: Object.keys(idMappings).length 
    });
  }
}

// =====================================
// MAIN EXECUTION
// =====================================

async function main() {
  try {
    // Initialize
    logger = createLogger();
    migrationId = `MIG-${format(new Date(), 'yyyyMMdd-HHmmss')}-${nanoid(8)}`;
    
    logger.info('=== RENTAL DATA MIGRATION STARTED ===', {
      migrationId,
      dryRun: argv.dryRun,
      inputFile: argv.input
    });

    // Load state for resume functionality
    if (argv.resumeFrom) {
      await loadState();
    }

    // Setup database connection
    await initSupabase();
    await introspectSchema();

    // Load and validate input data
    const inputFile = path.resolve(argv.input);
    if (!await fs.pathExists(inputFile)) {
      throw new Error(`Input file not found: ${inputFile}`);
    }

    const rawData = await fs.readJson(inputFile);
    const validatedData = await validateData(rawData);
    state.oldData = validatedData;

    // Backup existing data
    await backupExistingData();

    // Build indexes for deduplication
    await buildDbIndexes();

    // Run migrations in order
    await migrateProperties(validatedData.houses);
    await migrateRooms(validatedData.rooms);
    await migrateTenants(validatedData.tenants);
    await migrateContracts(validatedData.tenants);

    // Save state and generate report
    await saveState();
    const report = await generateReport();

    logger.info('=== MIGRATION COMPLETED SUCCESSFULLY ===', {
      migrationId,
      completedSteps: (state.completedSteps || []).length,
      totalMappings: Object.values(idMappings).reduce((sum, obj) => sum + Object.keys(obj || {}).length, 0)
    });

  } catch (error) {
    logger.error('Migration failed', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    if (logger) {
      logger.close();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Migration interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('Migration terminated');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };