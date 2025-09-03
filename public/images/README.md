# Thư mục hình ảnh cho ứng dụng

## Cấu trúc thư mục:

### 📁 `/public/images/rooms/`
- **Mục đích**: Lưu ảnh tượng trưng cho các phòng
- **Định dạng**: JPG, PNG, WebP
- **Kích thước khuyến nghị**: 800x600px hoặc 1200x800px
- **Tên file**: Có thể đặt tên theo room_id hoặc tên mô tả
- **Ví dụ**: 
  - `room-bedroom-1.jpg`
  - `room-studio-modern.png`
  - `room-2bed-apartment.jpg`

### 📁 `/public/images/tenants/`
- **Mục đích**: Lưu ảnh đại diện cho người thuê
- **Định dạng**: JPG, PNG, WebP
- **Kích thước khuyến nghị**: 400x400px (vuông)
- **Tên file**: Có thể đặt theo tenant_id hoặc tên
- **Ví dụ**:
  - `tenant-nguyen-van-a.jpg`
  - `tenant-profile-001.png`
  - `default-avatar.jpg`

### 📁 `/public/images/avatars/`
- **Mục đích**: Lưu các avatar mặc định và icon
- **Định dạng**: PNG, SVG
- **Kích thước khuyến nghị**: 200x200px
- **Ví dụ**:
  - `default-male.png`
  - `default-female.png`
  - `default-user.svg`

## Cách sử dụng trong code:

```javascript
// Ảnh phòng
<img src="/images/rooms/room-bedroom-1.jpg" alt="Phòng ngủ" />

// Ảnh người thuê
<img src="/images/tenants/tenant-nguyen-van-a.jpg" alt="Nguyễn Văn A" />

// Avatar mặc định
<img src="/images/avatars/default-user.svg" alt="Avatar" />
```

## Lưu ý:
- Tất cả ảnh sẽ được serve trực tiếp từ thư mục `/public`
- Đảm bảo tối ưu hóa kích thước file để tải nhanh
- Sử dụng WebP nếu có thể để giảm dung lượng
