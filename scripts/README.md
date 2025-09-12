# Migration Scripts

## Quick Start

### 1. Chạy thử (Dry Run) - QUAN TRỌNG!
```bash
node scripts/migrate-old-data.js --dry-run
```

### 2. Chạy migration thực tế
```bash
node scripts/migrate-old-data.js
```

## Requirements
- File `.env.local` có `NEXT_PUBLIC_SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`
- Dependencies đã cài: `fs-extra zod date-fns nanoid yargs p-limit`

## Key Features
✅ **Automatic Backup** - Tự động backup dữ liệu hiện có  
✅ **Deduplication** - Tránh tạo bản ghi trùng lặp  
✅ **Resume Support** - Tiếp tục nếu bị gián đoạn  
✅ **Dry Run** - Test trước khi chạy thực tế  
✅ **Comprehensive Logging** - Logs chi tiết và reports  

## Data Flow
```
Old JSON Data:
houses (2) → properties (2) 
rooms (15) → rooms (15)
tenants (15) → tenants (15) + rental_contracts (15)
```

## File Outputs
- `backups/YYYYMMDD-HHMMSS/` - Database backups
- `logs/migrate-*.log` - Detailed logs  
- `logs/migration-report-*.json` - Summary report
- `migrations/state.json` - Resume state

## Safety Features
- 🔒 **Always backup first** (unless --skip-backup)
- 🔄 **Upsert operations** (safe for re-runs)
- 📊 **Natural key deduplication**
- 🏃 **Resume capability** with --resume-from
- 📝 **Comprehensive logging**

## 🔄 Data Management

### Export Data
```bash
node scripts/export-data.js --format json --compress
```

### Import Data  
```bash
node scripts/import-data.js --input exports/data.json --dry-run
```

### Validate Data
```bash
node scripts/import-data.js --input exports/data.json --validate-only
```

## Available Scripts
- `migrate-old-data.js` - Migrate from old JSON format to Supabase
- `export-data.js` - Export user data (JSON/CSV/ZIP)
- `import-data.js` - Import data with validation & merge strategies

---

📖 **Detailed Guides**:
- Migration: See `../MIGRATION_GUIDE.md`  
- Data Management: See `../DATA_MANAGEMENT_GUIDE.md`
