# Hướng dẫn Quản lý Dữ liệu - Export/Import

## Tổng quan

Hệ thống rental-web cung cấp các công cụ mạnh mẽ để export và import dữ liệu, giúp bảo vệ và quản lý dữ liệu người dùng một cách an toàn và hiệu quả.

## 📥 Export Dữ liệu

### Tính năng chính
- ✅ **Multi-format**: JSON, CSV
- ✅ **Compression**: ZIP với tỷ lệ nén cao
- ✅ **User filtering**: Export theo user cụ thể (admin)
- ✅ **Table selection**: Chọn bảng cụ thể để export
- ✅ **Date range**: Filter theo khoảng thời gian
- ✅ **Progress tracking**: Theo dõi tiến độ realtime
- ✅ **Comprehensive logging**: Log chi tiết và báo cáo

### Sử dụng cơ bản

#### 1. Export tất cả dữ liệu (JSON)
```bash
node scripts/export-data.js
```

#### 2. Export với compression
```bash
node scripts/export-data.js --compress
```

#### 3. Export CSV format
```bash
node scripts/export-data.js --format csv --compress
```

#### 4. Export với invoices và utilities
```bash
node scripts/export-data.js --include-invoices --include-utilities
```

### Tùy chọn nâng cao

#### Export theo user cụ thể (Admin only)
```bash
node scripts/export-data.js --user-id abc123 --format json
```

#### Export theo date range
```bash
node scripts/export-data.js --date-range "2024-01-01:2024-12-31" --include-invoices
```

#### Export tables cụ thể
```bash
node scripts/export-data.js --tables "properties,rooms" --format csv
```

#### Specify output path
```bash
node scripts/export-data.js --output exports/my-backup.json --compress
```

### CLI Options đầy đủ

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--format` | string | json | Export format (json/csv) |
| `--output` | string | auto | Custom output file path |
| `--user-id` | string | - | Export for specific user (admin only) |
| `--include-invoices` | boolean | false | Include invoices & payment records |
| `--include-utilities` | boolean | false | Include utilities & bills |
| `--compress` | boolean | false | Compress with ZIP |
| `--date-range` | string | - | Filter by date (YYYY-MM-DD:YYYY-MM-DD) |
| `--tables` | string | all | Tables to export (comma separated) |
| `--batch-size` | number | 1000 | Records per batch |

## 📤 Import Dữ liệu

### Tính năng chính
- ✅ **Multi-format**: JSON, CSV, ZIP
- ✅ **Auto-detection**: Tự động phát hiện format
- ✅ **Validation**: Validate dữ liệu trước khi import
- ✅ **Merge strategies**: Skip, Replace, Merge
- ✅ **Deduplication**: Tránh tạo records trùng lặp
- ✅ **Dry-run mode**: Test trước khi import thật
- ✅ **Batch processing**: Xử lý theo batch với concurrency
- ✅ **Error handling**: Robust error handling & reporting

### Sử dụng cơ bản

#### 1. Validate dữ liệu trước khi import
```bash
node scripts/import-data.js --input exports/rental-export-20241201.json --validate-only
```

#### 2. Dry run (test import)
```bash
node scripts/import-data.js --input exports/rental-export-20241201.json --dry-run
```

#### 3. Import thực tế
```bash
node scripts/import-data.js --input exports/rental-export-20241201.json
```

### Merge Strategies

#### Skip (Default) - Bỏ qua records đã tồn tại
```bash
node scripts/import-data.js --input data.json --merge-strategy skip
```

#### Replace - Thay thế records đã tồn tại
```bash
node scripts/import-data.js --input data.json --merge-strategy replace
```

#### Merge - Chỉ cập nhật fields non-null
```bash
node scripts/import-data.js --input data.json --merge-strategy merge
```

### Tùy chọn nâng cao

#### Import CSV directory
```bash
node scripts/import-data.js --input exports/csv-export-20241201/
```

#### Import ZIP file
```bash
node scripts/import-data.js --input exports/rental-export-20241201.zip
```

#### Import tables cụ thể
```bash
node scripts/import-data.js --input data.json --tables "properties,rooms"
```

#### Import với batch size nhỏ hơn
```bash
node scripts/import-data.js --input data.json --batch-size 50
```

### CLI Options đầy đủ

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--input` | string | **required** | Input file path (JSON/CSV/ZIP) |
| `--format` | string | auto | Input format (auto-detected) |
| `--dry-run` | boolean | false | Preview import without writing DB |
| `--validate-only` | boolean | false | Only validate data structure |
| `--user-id` | string | - | Import for specific user (admin only) |
| `--merge-strategy` | string | skip | Handle existing records (skip/replace/merge) |
| `--tables` | string | all | Tables to import (comma separated) |
| `--batch-size` | number | 100 | Records per batch |

## 🔄 Workflow Examples

### 1. Complete Backup & Restore
```bash
# 1. Create full backup
node scripts/export-data.js --format json --compress --include-invoices --include-utilities

# 2. Validate backup
node scripts/import-data.js --input exports/rental-export-20241201.zip --validate-only

# 3. Test restore (dry-run)
node scripts/import-data.js --input exports/rental-export-20241201.zip --dry-run

# 4. Actual restore
node scripts/import-data.js --input exports/rental-export-20241201.zip --merge-strategy replace
```

### 2. Data Migration Between Environments
```bash
# Export from staging
node scripts/export-data.js --format csv --output staging-data --include-invoices

# Import to production
node scripts/import-data.js --input staging-data.zip --merge-strategy merge
```

### 3. Partial Data Sync
```bash
# Export only properties & rooms
node scripts/export-data.js --tables "properties,rooms" --date-range "2024-01-01:2024-12-31"

# Import with skip strategy (no overwrites)
node scripts/import-data.js --input exports/rental-export.json --merge-strategy skip
```

## 📊 Output Files & Structure

### Export Outputs

#### JSON Format
```json
{
  "metadata": {
    "exportId": "EXP-20241201-143052-abc123",
    "timestamp": "2024-12-01T14:30:52.123Z",
    "version": "1.0",
    "userId": "user_123",
    "format": "json",
    "tables": ["properties", "rooms", "tenants"],
    "recordCounts": {
      "properties": 5,
      "rooms": 25,
      "tenants": 18
    }
  },
  "data": {
    "properties": [...],
    "rooms": [...],
    "tenants": [...]
  }
}
```

#### CSV Format (directory structure)
```
rental-export-20241201/
├── metadata.json
├── properties.csv
├── rooms.csv
├── tenants.csv
└── rental_contracts.csv
```

### Generated Files
- `exports/rental-export-YYYYMMDD-HHMMSS-{userId}.{ext}` - Data export
- `logs/export-YYYYMMDD-HHMMSS.log` - Export logs
- `logs/export-report-YYYYMMDD-HHMMSS.json` - Export report
- `logs/import-YYYYMMDD-HHMMSS.log` - Import logs  
- `logs/import-report-YYYYMMDD-HHMMSS.json` - Import report

## 🔐 Security & Best Practices

### Data Protection
1. **Always backup before major operations**
2. **Use --validate-only and --dry-run first**
3. **Check logs and reports for errors**
4. **Store backups securely**
5. **Use compression for large exports**

### User Isolation
- Regular users: only their own data
- Admin users: can specify --user-id for any user
- RLS (Row Level Security) enforcement

### Error Recovery
1. Check logs in `logs/` directory
2. Review validation reports
3. Use appropriate merge strategy
4. Run incremental imports if needed

## 🚨 Troubleshooting

### Common Issues

#### 1. "Missing SUPABASE credentials"
```bash
# Check environment file
cat .env.local | grep SUPABASE
```

#### 2. "Validation error rate too high"
```bash
# Run validation-only to see details
node scripts/import-data.js --input data.json --validate-only
```

#### 3. "No data found to export"
- Check user permissions
- Verify database has data
- Check table names are correct

#### 4. "Memory issues with large exports"
```bash
# Use smaller batch sizes
node scripts/export-data.js --batch-size 500
```

### Performance Tuning

#### For Large Datasets
```bash
# Export with smaller batches
node scripts/export-data.js --batch-size 500

# Import with lower concurrency
node scripts/import-data.js --input data.json --batch-size 50
```

#### For Network Issues
```bash
# Increase retry behavior (built-in)
# Use compression to reduce transfer size
node scripts/export-data.js --compress
```

## 📈 Monitoring & Reports

### Export Report Example
```json
{
  "exportId": "EXP-20241201-143052-abc123",
  "duration": "45s",
  "results": {
    "totalRecords": 156,
    "totalSize": "2.3 MB",
    "tables": {
      "properties": {"recordCount": 5, "size": "1024"},
      "rooms": {"recordCount": 25, "size": "15360"}
    },
    "errors": []
  }
}
```

### Import Report Example
```json
{
  "importId": "IMP-20241201-143052-def456", 
  "duration": "32s",
  "results": {
    "totalRecords": 156,
    "inserted": 45,
    "updated": 23,
    "skipped": 88,
    "errors": 0
  }
}
```

## 🔗 Integration với Automation

### Scheduled Backups
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
node scripts/export-data.js \
  --format json \
  --compress \
  --include-invoices \
  --output "backups/daily-backup-$DATE.json"
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Export staging data
  run: node scripts/export-data.js --format json --output staging-data.json

- name: Import to production
  run: node scripts/import-data.js --input staging-data.json --dry-run
```

---

## 📞 Support

- 📋 **Check logs**: `logs/export-*.log`, `logs/import-*.log`
- 📊 **Check reports**: `logs/*-report-*.json`  
- 🔍 **Enable debug**: Set higher batch-size for more verbose logs
- 📧 **Need help**: Include log files and command used