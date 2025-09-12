# Hướng dẫn Migration Dữ liệu từ JSON cũ lên Supabase

## Tổng quan

Script `scripts/migrate-old-data.js` được thiết kế để đồng bộ dữ liệu từ format JSON cũ (houses, rooms, tenants) lên database Supabase mới với schema hiện đại (properties, rooms, tenants, rental_contracts).

## Yêu cầu tiền điều kiện

### 1. Environment Variables (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Dependencies đã cài đặt
```bash
npm install --save-dev fs-extra zod date-fns nanoid yargs p-limit
```

### 3. Cấu trúc thư mục
```
rental-web/
├── scripts/
│   └── migrate-old-data.js
├── data/
│   └── 65aa580eeefd3f1119b3c04d0db03951_rental-data-2025-09-11.json
├── logs/
├── backups/
└── migrations/
```

## Sử dụng cơ bản

### 1. Chạy thử (Dry Run)
```bash
node scripts/migrate-old-data.js --dry-run
```

### 2. Xem trợ giúp
```bash
node scripts/migrate-old-data.js --help
```

### 3. Chạy migration thực tế
```bash
node scripts/migrate-old-data.js
```

## Tùy chọn nâng cao

### CLI Options
```bash
node scripts/migrate-old-data.js [options]

Options:
  --dry-run                    Chạy thử không ghi database
  --input <path>              Đường dẫn file JSON input (default: data/65aa580eeefd3f1119b3c04d0db03951_rental-data-2025-09-11.json)
  --batch-size <number>       Số bản ghi mỗi batch (default: 200)
  --concurrency <number>      Số batch xử lý đồng thời (default: 4)
  --resume-from <step>        Tiếp tục từ bước (properties|rooms|tenants|contracts)
  --skip-backup               Bỏ qua backup
  --schema <name>             Database schema (default: public)
  --help                      Hiển thị trợ giúp
```

### Ví dụ sử dụng nâng cao
```bash
# Chạy với batch size nhỏ hơn
node scripts/migrate-old-data.js --batch-size 50 --concurrency 2

# Resume từ bước tenants (nếu bị gián đoạn)
node scripts/migrate-old-data.js --resume-from tenants

# Chạy với file input khác
node scripts/migrate-old-data.js --input data/backup-2025-01-01.json

# Bỏ qua backup (không khuyến nghị)
node scripts/migrate-old-data.js --skip-backup
```

## Quy trình Migration

### Bước 1: Pre-flight Checks
- Kiểm tra file input tồn tại và hợp lệ
- Test kết nối Supabase
- Introspect database schema
- Validate dữ liệu nguồn

### Bước 2: Backup
- Tự động backup dữ liệu hiện có trong Supabase
- Tạo manifest file với checksums
- Lưu vào `backups/YYYYMMDD-HHMMSS/`

### Bước 3: Build Indexes
- Tạo indexes trong memory cho deduplication
- Map natural keys để tránh insert trùng lặp

### Bước 4: Data Transformation & Migration
1. **Houses → Properties**: Transform và upsert properties
2. **Rooms → Rooms**: Transform với property_id mapping và upsert rooms  
3. **Tenants → Tenants**: Transform và upsert tenants
4. **Generate Contracts**: Tạo rental_contracts từ quan hệ tenant-room

### Bước 5: Verification & Reporting
- Kiểm tra integrity dữ liệu
- Tạo báo cáo migration
- Lưu state để resume

## Data Mapping

### Houses → Properties
```javascript
{
  // Old format (houses)
  id: "1751799140631_ztfu82txk_house",
  name: "Bạch Đằng, P.Gia Định - TpHCM", 
  address: "325/16/9 đường Bạch Đằng, Phường Gia Định - Tp.HCM.",
  notes: "...",
  image: "..."
}

// New format (properties)
{
  name: "Bạch Đằng, P.Gia Định - TpHCM",
  address: "325/16/9 đường Bạch Đằng, Phường Gia Định - Tp.HCM.", 
  district: null, // Không có trong data cũ
  city: "TP.HCM", // Default
  description: "...", // từ notes
  status: "active",
  // Computed fields sẽ được DB handle
  total_rooms: 0,
  occupied_rooms: 0,
  available_rooms: 0,
  occupancy_percentage: 0
}
```

### Rooms → Rooms  
```javascript
{
  // Old format
  id: "1751788600733_room",
  houseId: "1751799140632_vj6hegt12_house",
  name: "Số 01",
  price: 2200000,
  status: "occupied",
  area: "",
  description: "",
  image: ""
}

// New format  
{
  property_id: "<mapped_from_houseId>",
  room_number: "Số 01",
  floor: null, // Không có trong data cũ
  area_sqm: null, // Parse từ area nếu có
  rent_amount: 2200000,
  deposit_amount: 4400000, // Default: 2 tháng tiền phòng
  utilities: ["electricity", "water", "internet"], // Default
  status: "occupied",
  description: null,
  images: [] // Từ image nếu có
}
```

### Tenants → Tenants
```javascript
{
  // Old format
  id: "1751792206106_sgeyq0ghi_tenant",
  name: "Minh Trâm",
  phone: "0903123457", 
  idCard: "",
  roomId: "1751792065677_f9fijaqnm_room",
  rentStartDay: 27,
  rentEndDay: 26,
  notes: ""
}

// New format
{
  full_name: "Minh Trâm",
  phone: "0903123457", // Cleaned
  email: null, // Không có trong data cũ
  id_number: null, // Từ idCard nếu có
  birth_date: null,
  address: null,
  occupation: null,
  emergency_contact: null,
  emergency_phone: null,
  notes: ""
}
```

### Generate Rental Contracts
```javascript
// Tự động tạo từ quan hệ tenant-room
{
  room_id: "<mapped_room_id>",
  tenant_id: "<mapped_tenant_id>", 
  start_date: "2025-01-01", // Mặc định hoặc từ startDate
  end_date: null, // Từ endDate nếu có
  monthly_rent: 2200000, // Từ room price
  deposit_amount: 4400000, // Default: 2 tháng
  renewal_count: 0,
  status: "active"
}
```

## Deduplication Strategy

Script sử dụng "natural keys" để tránh tạo bản ghi trùng lặp:

- **Properties**: `name + address` (case-insensitive)
- **Rooms**: `property_id + room_number` (case-insensitive)  
- **Tenants**: `phone + full_name` hoặc `id_number` nếu có
- **Contracts**: `tenant_id + room_id + start_date`

## Error Handling & Resume

### Resume từ lỗi
Nếu migration bị gián đoạn, bạn có thể tiếp tục từ bước cuối cùng thành công:

```bash
node scripts/migrate-old-data.js --resume-from rooms
```

### State File
Migration state được lưu trong `migrations/state.json`:
```json
{
  "migration_id": "MIG-20250112-143052-xyz123",
  "timestamp": "2025-01-12T14:30:52.123Z",
  "completed_steps": ["properties", "rooms"],
  "id_mappings": {
    "houses": { "old_id": "new_id", ... },
    "rooms": { "old_id": "new_id", ... }
  }
}
```

## File Outputs

### Logs
- `logs/migrate-YYYYMMDD-HHMMSS.log` - Detailed JSON logs
- Console output với level INFO/WARN/ERROR

### Backups  
- `backups/YYYYMMDD-HHMMSS/` - Backup dữ liệu hiện có
- `manifest.json` - Metadata của backup

### Reports
- `logs/migration-report-YYYYMMDD-HHMMSS.json` - Báo cáo tổng kết
- `migrations/state.json` - State cho resume

## Troubleshooting

### Lỗi thường gặp

#### 1. "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
```bash
# Kiểm tra file .env.local
cat .env.local | grep SUPABASE
```

#### 2. "Input file not found"
```bash
# Kiểm tra file input
ls -la data/
```

#### 3. "Cannot connect to Supabase"
- Kiểm tra URL và key đúng không
- Kiểm tra network connectivity
- Đảm bảo service role key có quyền đúng

#### 4. "Table does not exist"
- Đảm bảo database schema đã được migrate
- Chạy Supabase migrations trước

### Performance Tuning

#### Đối với dữ liệu lớn
```bash
# Giảm batch size và concurrency
node scripts/migrate-old-data.js --batch-size 50 --concurrency 2
```

#### Đối với kết nối chậm
```bash
# Chạy từng bước một
node scripts/migrate-old-data.js --resume-from properties
# Sau khi xong properties:
node scripts/migrate-old-data.js --resume-from rooms
# etc.
```

## Rollback

### Manual Rollback từ Backups
```bash
# Restore từ backup files (cần implement thêm)
# Sử dụng files trong backups/YYYYMMDD-HHMMSS/
```

### Database-level Rollback
```sql
-- Nếu cần rollback hoàn toàn (cẩn thận!)
DELETE FROM rental_contracts WHERE created_at > '2025-01-12T14:00:00';
DELETE FROM tenants WHERE created_at > '2025-01-12T14:00:00';  
DELETE FROM rooms WHERE created_at > '2025-01-12T14:00:00';
DELETE FROM properties WHERE created_at > '2025-01-12T14:00:00';
```

## Best Practices

1. **Luôn chạy dry-run trước**
2. **Backup dữ liệu quan trọng trước khi chạy**  
3. **Chạy trên staging environment trước**
4. **Monitor logs trong quá trình chạy**
5. **Verify dữ liệu sau khi migration**
6. **Giữ backup files để rollback nếu cần**

## Contact & Support

Nếu có vấn đề, kiểm tra:
1. Logs files trong `logs/`
2. Migration report trong `logs/migration-report-*.json`
3. State file trong `migrations/state.json`

Đối với lỗi phức tạp, cung cấp:
- Command đã chạy
- Log file tương ứng  
- Migration report
- Sample data gây lỗi