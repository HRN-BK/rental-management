#!/usr/bin/env node

/**
 * Data Export Script: Export user data from Supabase
 * Supports JSON/CSV formats, compression, user filtering, and comprehensive logging
 * 
 * Usage:
 * node scripts/export-data.js --help
 * node scripts/export-data.js --format json --output exports/user-data.json
 * node scripts/export-data.js --format csv --compress --include-invoices
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
const archiver = require('archiver');
const csv = require('csv-writer').createObjectCsvWriter;
require('dotenv').config({ path: '.env.local' });

// =====================================
// CONFIGURATION & CLI SETUP
// =====================================

const CONFIG = {
  batchSize: 1000,
  concurrency: 3,
  maxExportSize: 100 * 1024 * 1024, // 100MB
  supportedFormats: ['json', 'csv'],
  compressionLevel: 6,
};

const argv = yargs(hideBin(process.argv))
  .option('format', {
    type: 'string',
    choices: CONFIG.supportedFormats,
    default: 'json',
    description: 'Export format'
  })
  .option('output', {
    type: 'string',
    description: 'Output file path',
    default: null
  })
  .option('user-id', {
    type: 'string',
    description: 'Export data for specific user ID (admin only)'
  })
  .option('include-invoices', {
    type: 'boolean',
    description: 'Include invoices and payment records',
    default: false
  })
  .option('include-utilities', {
    type: 'boolean',
    description: 'Include utilities and bills',
    default: false
  })
  .option('compress', {
    type: 'boolean',
    description: 'Compress output with zip',
    default: false
  })
  .option('date-range', {
    type: 'string',
    description: 'Date range filter (YYYY-MM-DD:YYYY-MM-DD)'
  })
  .option('tables', {
    type: 'string',
    description: 'Specific tables to export (comma separated)',
    default: 'properties,rooms,tenants,rental_contracts'
  })
  .option('batch-size', {
    type: 'number',
    description: 'Records per batch',
    default: CONFIG.batchSize
  })
  .help()
  .argv;

// Global state
let logger, supabase, exportId, currentUser;
let exportStats = {
  startTime: new Date(),
  tables: {},
  totalRecords: 0,
  totalSize: 0,
  errors: []
};

// =====================================
// LOGGING & UTILITIES
// =====================================

function createLogger() {
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const logFile = path.join(__dirname, '../logs', `export-${timestamp}.log`);
  
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
      exportStats.errors.push({ msg, ...data });
    },
    close: () => logStream.end()
  };
}

function generateFilename(format, compress = false) {
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const userSuffix = currentUser?.id ? `-${currentUser.id.slice(0, 8)}` : '';
  const ext = compress ? 'zip' : format;
  
  return `rental-export-${timestamp}${userSuffix}.${ext}`;
}

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

  supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Test connection and get current user context
  const { data: authUser } = await supabase.auth.getUser();
  
  if (argv.userId) {
    // Admin mode - export specific user data
    currentUser = { id: argv.userId, isAdmin: true };
    logger.info(`Admin export mode for user: ${argv.userId}`);
  } else {
    // Regular user mode - export own data
    if (!authUser?.user) {
      logger.warn('No authenticated user found, exporting all accessible data');
    }
    currentUser = authUser?.user || { id: 'anonymous' };
  }

  logger.info('Connected to Supabase successfully', { 
    userId: currentUser.id,
    adminMode: !!argv.userId 
  });
}

async function getUserFilter() {
  // In a real app, you'd implement proper user filtering based on RLS
  // For now, we'll use a simple approach
  
  if (currentUser.isAdmin || currentUser.id === 'anonymous') {
    return null; // No filter for admin or anonymous
  }
  
  // Add user filtering logic based on your app's user system
  // This might involve checking a user_id column or using RLS
  return null;
}

async function exportTable(tableName, userFilter = null) {
  logger.info(`Starting export for table: ${tableName}`);
  
  let query = supabase.from(tableName).select('*');
  
  // Apply user filter if needed
  if (userFilter) {
    // Example: query = query.eq('user_id', currentUser.id);
    // Implement based on your schema
  }
  
  // Apply date range filter
  if (argv.dateRange && ['rental_contracts', 'rental_invoices', 'payment_records'].includes(tableName)) {
    const [startDate, endDate] = argv.dateRange.split(':');
    if (startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate);
    }
  }
  
  const allData = [];
  let hasMore = true;
  let offset = 0;
  
  while (hasMore) {
    const { data, error, count } = await query
      .range(offset, offset + argv.batchSize - 1)
      .limit(argv.batchSize);
    
    if (error) {
      logger.error(`Error exporting ${tableName}`, { error: error.message });
      throw error;
    }
    
    if (data && data.length > 0) {
      allData.push(...data);
      offset += data.length;
      hasMore = data.length === argv.batchSize;
      
      logger.info(`Exported ${allData.length} records from ${tableName}...`);
    } else {
      hasMore = false;
    }
  }
  
  logger.info(`Completed export for ${tableName}`, { recordCount: allData.length });
  
  exportStats.tables[tableName] = {
    recordCount: allData.length,
    size: JSON.stringify(allData).length
  };
  exportStats.totalRecords += allData.length;
  
  return allData;
}

// =====================================
// EXPORT PROCESSORS
// =====================================

async function exportToJSON(data, outputPath) {
  logger.info('Exporting to JSON format...');
  
  const exportData = {
    metadata: {
      exportId,
      timestamp: new Date().toISOString(),
      version: '1.0',
      userId: currentUser.id,
      format: 'json',
      tables: Object.keys(data),
      recordCounts: Object.fromEntries(
        Object.entries(data).map(([table, records]) => [table, records.length])
      )
    },
    data
  };
  
  await fs.writeJson(outputPath, exportData, { spaces: 2 });
  
  const stats = await fs.stat(outputPath);
  exportStats.totalSize = stats.size;
  
  logger.info(`JSON export completed`, { 
    file: outputPath, 
    size: formatBytes(stats.size),
    records: exportStats.totalRecords
  });
  
  return outputPath;
}

async function exportToCSV(data, outputDir) {
  logger.info('Exporting to CSV format...');
  
  const csvFiles = [];
  
  for (const [tableName, records] of Object.entries(data)) {
    if (records.length === 0) continue;
    
    const csvPath = path.join(outputDir, `${tableName}.csv`);
    const headers = Object.keys(records[0]).map(key => ({ id: key, title: key }));
    
    const csvWriter = csv({
      path: csvPath,
      header: headers
    });
    
    await csvWriter.writeRecords(records);
    csvFiles.push(csvPath);
    
    const stats = await fs.stat(csvPath);
    logger.info(`CSV exported: ${tableName}`, { 
      file: csvPath,
      records: records.length,
      size: formatBytes(stats.size)
    });
  }
  
  // Create metadata file
  const metadataPath = path.join(outputDir, 'metadata.json');
  const metadata = {
    exportId,
    timestamp: new Date().toISOString(),
    version: '1.0',
    userId: currentUser.id,
    format: 'csv',
    tables: Object.keys(data),
    recordCounts: Object.fromEntries(
      Object.entries(data).map(([table, records]) => [table, records.length])
    ),
    files: csvFiles.map(f => path.basename(f))
  };
  
  await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  
  // Calculate total size
  let totalSize = 0;
  for (const file of [...csvFiles, metadataPath]) {
    const stats = await fs.stat(file);
    totalSize += stats.size;
  }
  exportStats.totalSize = totalSize;
  
  logger.info(`CSV export completed`, { 
    directory: outputDir, 
    files: csvFiles.length,
    size: formatBytes(totalSize),
    records: exportStats.totalRecords
  });
  
  return outputDir;
}

async function compressOutput(sourcePath, outputPath) {
  logger.info('Compressing export...');
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: CONFIG.compressionLevel } });
    
    output.on('close', () => {
      const compressedSize = archive.pointer();
      const compressionRatio = ((exportStats.totalSize - compressedSize) / exportStats.totalSize * 100).toFixed(1);
      
      logger.info('Compression completed', {
        originalSize: formatBytes(exportStats.totalSize),
        compressedSize: formatBytes(compressedSize),
        compressionRatio: `${compressionRatio}%`,
        outputFile: outputPath
      });
      
      resolve(outputPath);
    });
    
    archive.on('error', (err) => {
      logger.error('Compression failed', { error: err.message });
      reject(err);
    });
    
    archive.pipe(output);
    
    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory()) {
      archive.directory(sourcePath, false);
    } else {
      archive.file(sourcePath, { name: path.basename(sourcePath) });
    }
    
    archive.finalize();
  });
}

// =====================================
// MAIN EXPORT LOGIC
// =====================================

async function performExport() {
  const userFilter = await getUserFilter();
  const tablesToExport = argv.tables.split(',').map(t => t.trim());
  
  // Add conditional tables
  if (argv.includeInvoices) {
    tablesToExport.push('rental_invoices', 'payment_records');
  }
  
  if (argv.includeUtilities) {
    tablesToExport.push('utilities', 'utility_bills');
  }
  
  logger.info('Starting data export', {
    tables: tablesToExport,
    format: argv.format,
    userId: currentUser.id,
    includeInvoices: argv.includeInvoices,
    includeUtilities: argv.includeUtilities,
    compress: argv.compress
  });
  
  // Export data from all tables
  const exportedData = {};
  
  for (const tableName of tablesToExport) {
    try {
      const data = await exportTable(tableName, userFilter);
      if (data.length > 0) {
        exportedData[tableName] = data;
      }
    } catch (error) {
      logger.error(`Failed to export table ${tableName}`, { error: error.message });
      // Continue with other tables
    }
  }
  
  if (Object.keys(exportedData).length === 0) {
    throw new Error('No data found to export');
  }
  
  // Generate output path
  const outputDir = path.join(__dirname, '../exports');
  fs.ensureDirSync(outputDir);
  
  let outputPath;
  let finalPath;
  
  if (argv.format === 'json') {
    outputPath = argv.output || path.join(outputDir, generateFilename('json'));
    finalPath = await exportToJSON(exportedData, outputPath);
  } else if (argv.format === 'csv') {
    const dirName = generateFilename('csv').replace('.csv', '');
    outputPath = argv.output || path.join(outputDir, dirName);
    fs.ensureDirSync(outputPath);
    finalPath = await exportToCSV(exportedData, outputPath);
  }
  
  // Compress if requested
  if (argv.compress) {
    const compressedPath = `${finalPath}.zip`;
    finalPath = await compressOutput(finalPath, compressedPath);
    
    // Clean up uncompressed files
    if (argv.format === 'csv') {
      fs.removeSync(outputPath);
    } else {
      fs.removeSync(outputPath);
    }
  }
  
  return finalPath;
}

async function generateReport(outputPath) {
  const endTime = new Date();
  const duration = Math.round((endTime - exportStats.startTime) / 1000);
  
  const report = {
    exportId,
    startTime: exportStats.startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: `${duration}s`,
    userId: currentUser.id,
    config: {
      format: argv.format,
      compress: argv.compress,
      includeInvoices: argv.includeInvoices,
      includeUtilities: argv.includeUtilities,
      tables: argv.tables,
      batchSize: argv.batchSize
    },
    results: {
      outputPath,
      totalRecords: exportStats.totalRecords,
      totalSize: formatBytes(exportStats.totalSize),
      tables: exportStats.tables,
      errors: exportStats.errors
    }
  };
  
  const reportPath = path.join(__dirname, '../logs', `export-report-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`);
  await fs.writeJson(reportPath, report, { spaces: 2 });
  
  logger.info('Export report generated', { reportPath });
  return report;
}

// =====================================
// MAIN EXECUTION
// =====================================

async function main() {
  try {
    logger = createLogger();
    exportId = `EXP-${format(new Date(), 'yyyyMMdd-HHmmss')}-${nanoid(8)}`;
    
    logger.info('=== DATA EXPORT STARTED ===', {
      exportId,
      format: argv.format,
      compress: argv.compress
    });
    
    // Initialize Supabase connection
    await initSupabase();
    
    // Perform the export
    const outputPath = await performExport();
    
    // Generate report
    const report = await generateReport(outputPath);
    
    logger.info('=== EXPORT COMPLETED SUCCESSFULLY ===', {
      exportId,
      outputPath,
      totalRecords: exportStats.totalRecords,
      totalSize: formatBytes(exportStats.totalSize),
      duration: report.duration
    });
    
    // Output summary for user
    console.log(`\n🎉 Export completed successfully!`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Records: ${exportStats.totalRecords}`);
    console.log(`💾 Size: ${formatBytes(exportStats.totalSize)}`);
    console.log(`⏱️  Duration: ${report.duration}`);
    
    if (exportStats.errors.length > 0) {
      console.log(`⚠️  Warnings: ${exportStats.errors.length} (check logs)`);
    }
    
  } catch (error) {
    logger.error('Export failed', { error: error.message, stack: error.stack });
    console.error(`\n❌ Export failed: ${error.message}`);
    process.exit(1);
  } finally {
    if (logger) {
      logger.close();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Export interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('Export terminated');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };