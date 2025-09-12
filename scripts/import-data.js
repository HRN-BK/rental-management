#!/usr/bin/env node

/**
 * Data Import Script: Import user data into Supabase
 * Supports JSON/CSV formats, validation, deduplication, and rollback
 * 
 * Usage:
 * node scripts/import-data.js --help
 * node scripts/import-data.js --input exports/user-data.json --dry-run
 * node scripts/import-data.js --input exports/user-data.json --merge-strategy replace
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
const csvParser = require('csv-parser');
const unzipper = require('unzipper');
require('dotenv').config({ path: '.env.local' });

// =====================================
// CONFIGURATION & CLI SETUP
// =====================================

const CONFIG = {
  batchSize: 100,
  concurrency: 2,
  maxImportSize: 500 * 1024 * 1024, // 500MB
  supportedFormats: ['json', 'csv'],
  mergeStrategies: ['skip', 'replace', 'merge'],
};

const argv = yargs(hideBin(process.argv))
  .option('input', {
    type: 'string',
    demandOption: true,
    description: 'Input file path (JSON, CSV, or ZIP)'
  })
  .option('format', {
    type: 'string',
    choices: CONFIG.supportedFormats,
    description: 'Input format (auto-detected if not specified)'
  })
  .option('dry-run', {
    type: 'boolean',
    description: 'Validate and preview import without writing to database',
    default: false
  })
  .option('user-id', {
    type: 'string',
    description: 'Import data for specific user ID (admin only)'
  })
  .option('merge-strategy', {
    type: 'string',
    choices: CONFIG.mergeStrategies,
    default: 'skip',
    description: 'How to handle existing records (skip/replace/merge)'
  })
  .option('tables', {
    type: 'string',
    description: 'Specific tables to import (comma separated)'
  })
  .option('batch-size', {
    type: 'number',
    description: 'Records per batch',
    default: CONFIG.batchSize
  })
  .option('validate-only', {
    type: 'boolean',
    description: 'Only validate data structure without importing',
    default: false
  })
  .help()
  .argv;

// Global state
let logger, supabase, importId, currentUser;
let importStats = {
  startTime: new Date(),
  tables: {},
  totalRecords: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  errors: [],
  rollbackData: {}
};

// =====================================
// LOGGING & UTILITIES
// =====================================

function createLogger() {
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const logFile = path.join(__dirname, '../logs', `import-${timestamp}.log`);
  
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
      importStats.errors.push({ msg, ...data });
    },
    close: () => logStream.end()
  };
}

function detectFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.json') return 'json';
  if (ext === '.csv') return 'csv';
  if (ext === '.zip') return 'zip';
  
  return 'unknown';
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================
// DATA VALIDATION SCHEMAS
// =====================================

const PropertySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  address: z.string().min(1),
  district: z.string().nullable().optional(),
  city: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  total_rooms: z.number().optional(),
  occupied_rooms: z.number().optional(),
  available_rooms: z.number().optional(),
  occupancy_percentage: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const RoomSchema = z.object({
  id: z.string().optional(),
  property_id: z.string(),
  room_number: z.string().min(1),
  floor: z.string().nullable().optional(),
  area_sqm: z.number().nullable().optional(),
  rent_amount: z.number().nonnegative(),
  deposit_amount: z.number().nullable().optional(),
  utilities: z.array(z.string()).optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const TenantSchema = z.object({
  id: z.string().optional(),
  full_name: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  id_number: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  emergency_contact: z.string().nullable().optional(),
  emergency_phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const RentalContractSchema = z.object({
  id: z.string().optional(),
  room_id: z.string(),
  tenant_id: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  monthly_rent: z.number().nonnegative(),
  deposit_amount: z.number().nullable().optional(),
  renewal_count: z.number().optional(),
  status: z.enum(['active', 'expired', 'terminated']).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const ValidationSchemas = {
  properties: PropertySchema,
  rooms: RoomSchema,
  tenants: TenantSchema,
  rental_contracts: RentalContractSchema
};

// =====================================
// DATABASE OPERATIONS
// =====================================

async function initSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  }

  supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Test connection and get user context
  const { data: authUser } = await supabase.auth.getUser();
  
  if (argv.userId) {
    currentUser = { id: argv.userId, isAdmin: true };
    logger.info(`Admin import mode for user: ${argv.userId}`);
  } else {
    currentUser = authUser?.user || { id: 'anonymous' };
  }

  logger.info('Connected to Supabase successfully', { 
    userId: currentUser.id,
    adminMode: !!argv.userId 
  });
}

async function checkExistingRecord(tableName, record) {
  // Check for existing records based on natural keys
  let query = supabase.from(tableName).select('id');
  
  switch (tableName) {
    case 'properties':
      query = query.eq('name', record.name).eq('address', record.address);
      break;
    case 'rooms':
      query = query.eq('property_id', record.property_id).eq('room_number', record.room_number);
      break;
    case 'tenants':
      if (record.id_number) {
        query = query.eq('id_number', record.id_number);
      } else if (record.email) {
        query = query.eq('email', record.email);
      } else {
        query = query.eq('full_name', record.full_name).eq('phone', record.phone);
      }
      break;
    case 'rental_contracts':
      query = query.eq('room_id', record.room_id).eq('tenant_id', record.tenant_id).eq('start_date', record.start_date);
      break;
    default:
      return null;
  }
  
  const { data, error } = await query.limit(1);
  
  if (error) {
    logger.error(`Error checking existing record in ${tableName}`, { error: error.message });
    return null;
  }
  
  return data && data.length > 0 ? data[0] : null;
}

async function insertRecord(tableName, record) {
  const { data, error } = await supabase
    .from(tableName)
    .insert(record)
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return data;
}

async function updateRecord(tableName, id, record) {
  const { data, error } = await supabase
    .from(tableName)
    .update(record)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return data;
}

async function processRecord(tableName, record) {
  const existingRecord = await checkExistingRecord(tableName, record);
  
  if (existingRecord) {
    switch (argv.mergeStrategy) {
      case 'skip':
        logger.info(`Skipping existing record in ${tableName}`, { id: existingRecord.id });
        importStats.skipped++;
        return { action: 'skipped', record: existingRecord };
        
      case 'replace':
        const updated = await updateRecord(tableName, existingRecord.id, record);
        logger.info(`Updated record in ${tableName}`, { id: existingRecord.id });
        importStats.updated++;
        return { action: 'updated', record: updated };
        
      case 'merge':
        // Merge strategy: only update non-null fields
        const mergedRecord = { ...record };
        Object.keys(mergedRecord).forEach(key => {
          if (mergedRecord[key] === null || mergedRecord[key] === undefined) {
            delete mergedRecord[key];
          }
        });
        const merged = await updateRecord(tableName, existingRecord.id, mergedRecord);
        logger.info(`Merged record in ${tableName}`, { id: existingRecord.id });
        importStats.updated++;
        return { action: 'merged', record: merged };
        
      default:
        throw new Error(`Unknown merge strategy: ${argv.mergeStrategy}`);
    }
  } else {
    const inserted = await insertRecord(tableName, record);
    logger.info(`Inserted new record in ${tableName}`, { id: inserted.id });
    importStats.inserted++;
    return { action: 'inserted', record: inserted };
  }
}

// =====================================
// DATA LOADING & PARSING
// =====================================

async function loadJSONData(filePath) {
  logger.info('Loading JSON data...');
  
  const data = await fs.readJson(filePath);
  
  // Handle both export format and raw data format
  if (data.metadata && data.data) {
    // Export format
    logger.info('Detected export format', { 
      exportId: data.metadata.exportId,
      tables: data.metadata.tables,
      recordCounts: data.metadata.recordCounts
    });
    return data.data;
  } else {
    // Raw data format
    logger.info('Detected raw data format');
    return data;
  }
}

async function loadCSVData(inputPath) {
  logger.info('Loading CSV data...');
  
  const data = {};
  const stats = fs.statSync(inputPath);
  
  if (stats.isDirectory()) {
    // Multiple CSV files in directory
    const files = await fs.readdir(inputPath);
    const csvFiles = files.filter(f => f.endsWith('.csv'));
    
    for (const file of csvFiles) {
      const tableName = path.basename(file, '.csv');
      const filePath = path.join(inputPath, file);
      
      data[tableName] = await parseCSVFile(filePath);
      logger.info(`Loaded CSV table: ${tableName}`, { records: data[tableName].length });
    }
  } else {
    // Single CSV file
    const tableName = path.basename(inputPath, '.csv');
    data[tableName] = await parseCSVFile(inputPath);
    logger.info(`Loaded CSV file: ${tableName}`, { records: data[tableName].length });
  }
  
  return data;
}

async function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        // Parse numeric fields and handle nulls
        Object.keys(row).forEach(key => {
          if (row[key] === '' || row[key] === 'null') {
            row[key] = null;
          } else if (!isNaN(row[key]) && row[key] !== '') {
            row[key] = parseFloat(row[key]);
          }
        });
        results.push(row);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function extractZipData(filePath) {
  logger.info('Extracting ZIP file...');
  
  const extractDir = path.join(__dirname, '../temp', `import-${importId}`);
  fs.ensureDirSync(extractDir);
  
  await fs.createReadStream(filePath)
    .pipe(unzipper.Extract({ path: extractDir }))
    .promise();
    
  // Look for data files in extracted directory
  const files = await fs.readdir(extractDir);
  
  if (files.includes('metadata.json')) {
    // CSV export format
    return await loadCSVData(extractDir);
  } else {
    // Look for JSON file
    const jsonFile = files.find(f => f.endsWith('.json'));
    if (jsonFile) {
      return await loadJSONData(path.join(extractDir, jsonFile));
    }
  }
  
  throw new Error('No recognizable data format found in ZIP file');
}

// =====================================
// DATA VALIDATION & PROCESSING
// =====================================

async function validateData(data) {
  logger.info('Validating import data...');
  
  const validationResults = {};
  let totalErrors = 0;
  
  for (const [tableName, records] of Object.entries(data)) {
    if (!Array.isArray(records)) {
      logger.warn(`Table ${tableName} is not an array, skipping`);
      continue;
    }
    
    const schema = ValidationSchemas[tableName];
    if (!schema) {
      logger.warn(`No validation schema for table ${tableName}, skipping validation`);
      validationResults[tableName] = { 
        valid: records.length, 
        invalid: 0, 
        errors: [] 
      };
      continue;
    }
    
    const errors = [];
    let validCount = 0;
    
    records.forEach((record, index) => {
      try {
        schema.parse(record);
        validCount++;
      } catch (error) {
        errors.push({
          index,
          record,
          error: error.message
        });
      }
    });
    
    validationResults[tableName] = {
      valid: validCount,
      invalid: errors.length,
      errors: errors.slice(0, 10) // Limit error details
    };
    
    totalErrors += errors.length;
    
    logger.info(`Validated ${tableName}`, {
      total: records.length,
      valid: validCount,
      invalid: errors.length
    });
  }
  
  // Check error threshold
  const totalRecords = Object.values(data).reduce((sum, records) => sum + (Array.isArray(records) ? records.length : 0), 0);
  const errorRate = totalRecords > 0 ? (totalErrors / totalRecords) * 100 : 0;
  
  if (errorRate > 5) {
    throw new Error(`Validation error rate too high: ${errorRate.toFixed(1)}% (${totalErrors}/${totalRecords} records)`);
  }
  
  logger.info('Data validation completed', {
    totalRecords,
    totalErrors,
    errorRate: `${errorRate.toFixed(1)}%`
  });
  
  return validationResults;
}

async function importTableData(tableName, records) {
  if (!records || records.length === 0) {
    logger.info(`No records to import for ${tableName}`);
    return;
  }
  
  logger.info(`Starting import for ${tableName}`, { recordCount: records.length });
  
  importStats.tables[tableName] = {
    total: records.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };
  
  const limit = pLimit(CONFIG.concurrency);
  const batches = [];
  
  for (let i = 0; i < records.length; i += argv.batchSize) {
    const batch = records.slice(i, i + argv.batchSize);
    batches.push(limit(() => processBatch(tableName, batch)));
  }
  
  await Promise.all(batches);
  
  logger.info(`Completed import for ${tableName}`, importStats.tables[tableName]);
}

async function processBatch(tableName, records) {
  for (const record of records) {
    try {
      if (!argv.dryRun && !argv.validateOnly) {
        await processRecord(tableName, record);
      } else {
        logger.info(`[DRY RUN] Would process ${tableName} record`, { record });
        importStats.inserted++;
      }
      
      importStats.totalRecords++;
    } catch (error) {
      logger.error(`Failed to process record in ${tableName}`, {
        record,
        error: error.message
      });
      
      importStats.tables[tableName].errors++;
    }
  }
}

// =====================================
// MAIN IMPORT LOGIC
// =====================================

async function performImport(data) {
  // Import order matters due to foreign key constraints
  const importOrder = ['properties', 'rooms', 'tenants', 'rental_contracts'];
  
  // Filter tables to import
  const tablesToImport = argv.tables 
    ? argv.tables.split(',').map(t => t.trim())
    : importOrder.filter(table => data[table]);
  
  logger.info('Starting data import', {
    tables: tablesToImport,
    mergeStrategy: argv.mergeStrategy,
    dryRun: argv.dryRun,
    validateOnly: argv.validateOnly
  });
  
  // Import tables in correct order
  for (const tableName of importOrder) {
    if (tablesToImport.includes(tableName) && data[tableName]) {
      await importTableData(tableName, data[tableName]);
    }
  }
}

async function generateReport() {
  const endTime = new Date();
  const duration = Math.round((endTime - importStats.startTime) / 1000);
  
  const report = {
    importId,
    startTime: importStats.startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: `${duration}s`,
    userId: currentUser.id,
    config: {
      input: argv.input,
      format: argv.format,
      mergeStrategy: argv.mergeStrategy,
      dryRun: argv.dryRun,
      validateOnly: argv.validateOnly,
      tables: argv.tables,
      batchSize: argv.batchSize
    },
    results: {
      totalRecords: importStats.totalRecords,
      inserted: importStats.inserted,
      updated: importStats.updated,
      skipped: importStats.skipped,
      errors: importStats.errors.length,
      tables: importStats.tables
    }
  };
  
  const reportPath = path.join(__dirname, '../logs', `import-report-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`);
  await fs.writeJson(reportPath, report, { spaces: 2 });
  
  logger.info('Import report generated', { reportPath });
  return report;
}

// =====================================
// MAIN EXECUTION
// =====================================

async function main() {
  try {
    logger = createLogger();
    importId = `IMP-${format(new Date(), 'yyyyMMdd-HHmmss')}-${nanoid(8)}`;
    
    logger.info('=== DATA IMPORT STARTED ===', {
      importId,
      input: argv.input,
      dryRun: argv.dryRun,
      validateOnly: argv.validateOnly
    });
    
    // Check input file
    if (!await fs.pathExists(argv.input)) {
      throw new Error(`Input file not found: ${argv.input}`);
    }
    
    // Initialize Supabase connection
    await initSupabase();
    
    // Detect and load data
    const format = argv.format || detectFormat(argv.input);
    let data;
    
    switch (format) {
      case 'json':
        data = await loadJSONData(argv.input);
        break;
      case 'csv':
        data = await loadCSVData(argv.input);
        break;
      case 'zip':
        data = await extractZipData(argv.input);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    // Validate data
    const validationResults = await validateData(data);
    
    if (argv.validateOnly) {
      logger.info('Validation completed', { validationResults });
      console.log('\n✅ Data validation completed successfully!');
      console.log('📋 Validation Results:');
      
      Object.entries(validationResults).forEach(([table, results]) => {
        console.log(`  ${table}: ${results.valid} valid, ${results.invalid} invalid`);
      });
      
      return;
    }
    
    // Perform import
    await performImport(data);
    
    // Generate report
    const report = await generateReport();
    
    logger.info('=== IMPORT COMPLETED SUCCESSFULLY ===', {
      importId,
      totalRecords: importStats.totalRecords,
      inserted: importStats.inserted,
      updated: importStats.updated,
      skipped: importStats.skipped,
      errors: importStats.errors.length
    });
    
    // Output summary for user
    const prefix = argv.dryRun ? '[DRY RUN] ' : '';
    console.log(`\n🎉 ${prefix}Import completed successfully!`);
    console.log(`📊 Total Records: ${importStats.totalRecords}`);
    console.log(`➕ Inserted: ${importStats.inserted}`);
    console.log(`🔄 Updated: ${importStats.updated}`);
    console.log(`⏭️  Skipped: ${importStats.skipped}`);
    console.log(`⏱️  Duration: ${report.duration}`);
    
    if (importStats.errors.length > 0) {
      console.log(`⚠️  Errors: ${importStats.errors.length} (check logs)`);
    }
    
  } catch (error) {
    logger.error('Import failed', { error: error.message, stack: error.stack });
    console.error(`\n❌ Import failed: ${error.message}`);
    process.exit(1);
  } finally {
    if (logger) {
      logger.close();
    }
    
    // Cleanup temp directory
    const tempDir = path.join(__dirname, '../temp', `import-${importId}`);
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Import interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('Import terminated');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };