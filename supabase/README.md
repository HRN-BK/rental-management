# Supabase Setup Guide

Hướng dẫn thiết lập database Supabase cho hệ thống quản lý nhà cho thuê.

## 🚀 Quick Setup

### 1. Tạo Supabase Project

1. Truy cập [supabase.com](https://supabase.com)
2. Đăng ký/Đăng nhập tài khoản
3. Tạo New Project:
   - **Name**: `rental-management`
   - **Database Password**: Tạo password mạnh
   - **Region**: Singapore (gần Việt Nam nhất)

### 2. Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục gốc:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Service role key for server-side operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Lấy thông tin từ Supabase Dashboard:**

- Vào Project > Settings > API
- Copy `URL` và `anon public` key

### 3. Chạy Database Migration

**Option 1: Supabase Dashboard (Đề xuất)**

1. Vào Supabase Dashboard
2. Chọn SQL Editor
3. Copy nội dung file `migrations/001_initial_schema.sql`
4. Paste và chạy script

**Option 2: Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

## 📊 Database Schema Overview

### Core Tables

#### **Properties** (`properties`)

Thông tin các nhà cho thuê

- `id`: UUID (Primary Key)
- `name`: Tên nhà (VD: "Bạch Đằng, P.Gia Định")
- `address`: Địa chỉ đầy đủ
- `district`, `city`: Quận/huyện, thành phố
- `total_rooms`, `occupied_rooms`, `available_rooms`: Thống kê phòng
- `occupancy_percentage`: Tỷ lệ lấp đầy (%)

#### **Rooms** (`rooms`)

Thông tin từng phòng cho thuê

- `id`: UUID (Primary Key)
- `property_id`: Liên kết với Properties
- `room_number`: Số phòng
- `rent_amount`: Giá thuê hàng tháng
- `status`: Trạng thái (available/occupied/maintenance)
- `utilities`: Array tiện ích

#### **Tenants** (`tenants`)

Thông tin người thuê

- `id`: UUID (Primary Key)
- `full_name`: Họ tên đầy đủ
- `phone`, `email`: Thông tin liên hệ
- `id_number`: Số CMND/CCCD
- `emergency_contact`: Người liên hệ khẩn cấp

#### **Rental Contracts** (`rental_contracts`)

Hợp đồng thuê nhà

- `id`: UUID (Primary Key)
- `room_id`, `tenant_id`: Liên kết phòng và người thuê
- `start_date`, `end_date`: Thời gian hợp đồng
- `monthly_rent`: Tiền thuê hàng tháng
- `status`: Trạng thái hợp đồng

#### **Payment Records** (`payment_records`)

Lịch sử thanh toán

- `id`: UUID (Primary Key)
- `contract_id`, `tenant_id`: Liên kết hợp đồng và người thuê
- `amount`: Số tiền
- `month_year`: Tháng thanh toán (2024-01)
- `status`: Trạng thái thanh toán

#### **Receipts** (`receipts`)

Phiếu thu

- `id`: UUID (Primary Key)
- `payment_record_id`: Liên kết với payment record
- `receipt_number`: Số phiếu thu
- `payment_method`: Phương thức thanh toán

## 🔧 Features

### Auto-calculated Fields

- **Property Statistics**: Tự động tính `total_rooms`, `occupied_rooms`, `available_rooms`
- **Occupancy Rate**: Tự động tính `occupancy_percentage`
- **Timestamps**: Tự động `created_at`, `updated_at`

### Database Triggers

- **Room Count Updates**: Khi thêm/sửa/xóa phòng → cập nhật thống kê property
- **Status Sync**: Khi tạo/kết thúc hợp đồng → cập nhật trạng thái phòng

### Data Relationships

```
Properties (1) ──→ (N) Rooms
Tenants (1) ──→ (N) Rental Contracts ──→ (1) Rooms
Rental Contracts (1) ──→ (N) Payment Records
Payment Records (1) ──→ (1) Receipts
```

## 📝 Sample Data

Database sẽ được tạo với dữ liệu mẫu:

**Properties:**

- Bạch Đằng, P.Gia Định - TpHCM (10 phòng)
- Bình Chuẩn, P.An Phú, TpHCM (5 phòng)

**Sample Tenants:**

- Nguyễn Văn A, Trần Thị B, Lê Văn C, Phạm Thị D

## 🔒 Row Level Security (RLS)

**⚠️ Quan trọng**: Sau khi tạo tables, cần setup RLS để bảo mật:

```sql
-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create policies (example - adjust based on your auth needs)
CREATE POLICY "Allow all for authenticated users" ON properties
  FOR ALL USING (auth.role() = 'authenticated');

-- Repeat for other tables...
```

## 🚀 Next Steps

1. **✅ Setup Database**: Chạy migration script
2. **🔐 Configure Auth**: Setup Supabase Authentication
3. **🔒 Enable RLS**: Thiết lập Row Level Security
4. **📱 Test Connection**: Kiểm tra kết nối trong ứng dụng
5. **💾 Backup Strategy**: Thiết lập backup tự động

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra Supabase Dashboard > Logs
2. Xem Network tab trong DevTools
3. Đảm bảo environment variables đúng
4. Kiểm tra RLS policies

## 🔄 Database Updates

Khi cần cập nhật schema:

1. Tạo migration file mới: `002_update_xxx.sql`
2. Chạy migration qua Dashboard hoặc CLI
3. Cập nhật TypeScript types tương ứng

---

**🎯 Kết quả**: Sau khi hoàn thành, bạn sẽ có database hoàn chỉnh cho hệ thống quản lý nhà cho thuê với đầy đủ relationships và sample data!
