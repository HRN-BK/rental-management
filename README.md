# 🏠 Rental Management Web Application

**Hệ thống quản lý cho thuê phòng trọ hiện đại** - Xây dựng với Next.js 15, Supabase, và Tailwind CSS

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)

## ✨ Tính năng chính

### 🏢 Quản lý Tài sản
- ✅ Thêm, sửa, xóa nhà cho thuê
- ✅ Theo dõi tình trạng phòng trống/đã thuê
- ✅ Quản lý thông tin chi tiết từng tài sản
- ✅ Dashboard tổng quan với thống kê

### 🏠 Quản lý Phòng
- ✅ Quản lý danh sách phòng theo từng nhà
- ✅ Cập nhật giá thuê, tiện ích, mô tả
- ✅ Upload và quản lý hình ảnh phòng
- ✅ Theo dõi tình trạng bảo trì

### 👥 Quản lý Người thuê
- ✅ Hồ sơ chi tiết người thuê
- ✅ Lịch sử hợp đồng và thanh toán
- ✅ Thông tin liên hệ khẩn cấp
- ✅ Ghi chú và theo dõi đặc biệt

### 📋 Hệ thống Hóa đơn
- ✅ Tạo hóa đơn tự động theo tháng
- ✅ Tính toán tiền điện, nước, internet
- ✅ Multiple templates (Simple & Professional)
- ✅ Export PDF và PNG với custom colors
- ✅ Lưu trữ và tra cứu lịch sử

### 🧾 Quản lý Thanh toán
- ✅ Tạo biên lai thanh toán
- ✅ Theo dõi tình trạng thanh toán
- ✅ Export biên lai với branding tùy chỉnh
- ✅ Thống kê doanh thu theo tháng

### 📱 Responsive Design
- ✅ Tối ưu cho mobile và desktop
- ✅ Touch-friendly navigation trên mobile
- ✅ Pull-to-refresh functionality
- ✅ Progressive Web App ready

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **PDF Generation**: Puppeteer + jsPDF
- **Image Processing**: html2canvas
- **State Management**: React Context
- **Form Validation**: Zod + React Hook Form

## 📋 Yêu cầu hệ thống

- Node.js 18.0.0 trở lên
- npm hoặc yarn
- Tài khoản Supabase (miễn phí)

## 🔧 Cài đặt và Cấu hình

### 1. Clone Repository

```bash
git clone <repository-url>
cd rental-web
npm install
```

### 2. Cấu hình Supabase

1. Tạo project mới tại [supabase.com](https://supabase.com)
2. Copy URL và Anon Key từ project settings
3. Tạo file `.env.local` từ `.env.example`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 3. Thiết lập Database

Chạy các SQL commands trong Supabase SQL Editor từ file `setup-database.sql`

### 4. Chạy ứng dụng

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 🌍 Deploy lên Vercel

### Tự động Deploy (Khuyến nghị)

1. Push code lên GitHub/GitLab
2. Kết nối repository với [Vercel](https://vercel.com)
3. Thêm environment variables trong Vercel dashboard
4. Deploy tự động sẽ chạy

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables cho Production

Trong Vercel Dashboard, thêm các biến sau từ file `.env.example`

## 🔐 Bảo mật

- ✅ Row Level Security (RLS) enabled trên tất cả tables
- ✅ JWT token authentication với Supabase
- ✅ Server-side validation cho tất cả API routes
- ✅ Input sanitization và validation
- ✅ CORS configuration
- ✅ Environment variables cho sensitive data

## 📄 License

Dự án được phân phối dưới giấy phép MIT.

---

**Được xây dựng với ❤️ cho cộng đồng quản lý bất động sản**
