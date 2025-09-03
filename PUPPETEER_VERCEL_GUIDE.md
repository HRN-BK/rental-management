# 🚀 Puppeteer trên Vercel - Troubleshooting Guide

## ✅ Đã sửa các vấn đề sau:

### 1. **Dependencies không tương thích**
- **Vấn đề**: `@sparticuz/chromium@110.0.0` và `puppeteer-core@24.18.0` không tương thích
- **Giải pháp**: Cập nhật lên:
  ```json
  "@sparticuz/chromium": "^131.0.0",
  "puppeteer-core": "^23.8.0"
  ```

### 2. **Cấu hình Chromium API sai**
- **Vấn đề**: `chromium.setHeadlessMode` và `chromium.setGraphicsMode` không tồn tại trong API mới
- **Giải pháp**: Sử dụng cấu hình đúng:
  ```javascript
  const browser = await puppeteer.launch({
    args: [...chromium.args, ...optimizedArgs],
    executablePath: await chromium.executablePath(),
    headless: true,
  })
  ```

### 3. **Thiếu args tối ưu cho AWS Lambda**
- **Vấn đề**: Vercel chạy trên AWS Lambda, cần args đặc biệt
- **Giải pháp**: Thêm args optimized:
  ```javascript
  const launchArgs = [
    ...chromium.args,
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-sandbox',
    '--single-process',
    // ... thêm nhiều args khác
  ]
  ```

### 4. **Timeout và Memory Issues**
- **Vấn đề**: Cold start lâu, memory không đủ
- **Giải pháp**:
  ```json
  // vercel.json
  "src/app/api/receipts/screenshot/route.ts": {
    "memory": 1024, // Max cho Hobby plan
    "maxDuration": 60
  }
  ```

### 5. **Bundle Configuration**
- **Vấn đề**: Puppeteer bị bundle vào client
- **Giải pháp**:
  ```javascript
  // next.config.ts
  serverExternalPackages: [
    'puppeteer-core', 
    '@sparticuz/chromium'
  ]
  ```

## 🔧 Kiểm tra khi gặp lỗi

### Lỗi thường gặp:

1. **"Could not find Chromium"**
   ```bash
   # Kiểm tra phiên bản
   npm ls @sparticuz/chromium puppeteer-core
   # Cần: @sparticuz/chromium@131.0.0 + puppeteer-core@23.8.0
   ```

2. **"Navigation timeout exceeded"**
   - Giảm `waitUntil` từ `networkidle0` xuống `domcontentloaded`
   - Tăng timeout trong `setContent()`
   - Disable external resources không cần thiết

3. **"Function timeout"**
   - Tăng `maxDuration` trong `vercel.json`
   - Optimize rendering time
   - Add proper cleanup với `finally` block

4. **"Protocol error"**
   - Thường do memory không đủ
   - Giảm viewport size
   - Add `--single-process` arg

## 🛠️ Testing Local vs Production

### Local development:
```javascript
const executablePath = isProduction 
  ? await chromium.executablePath() 
  : undefined // Dùng system Chromium
```

### Production (Vercel):
- Luôn sử dụng `@sparticuz/chromium`
- Args đặc biệt cho AWS Lambda
- Memory limit: 1024MB (Hobby) hoặc 3008MB (Pro)

## 📊 Performance Optimization

1. **Disable unnecessary resources**:
   ```javascript
   page.on('request', (req) => {
     if (req.resourceType() === 'image' && !req.url().startsWith('data:')) {
       req.abort()
     } else {
       req.continue()
     }
   })
   ```

2. **Optimize viewport**:
   ```javascript
   await page.setViewport({
     width: 800,
     height: 1200,
     deviceScaleFactor: 2,
   })
   ```

3. **Proper cleanup**:
   ```javascript
   try {
     // ... Puppeteer operations
   } finally {
     if (page) await page.close()
     if (browser) await browser.close()
   }
   ```

## 🔍 Debug Commands

```bash
# Xem logs của deployment
vercel logs <deployment-url>

# Xem danh sách deployments
vercel ls

# Deploy với debug
vercel --prod --debug

# Check dependencies
npm ls @sparticuz/chromium puppeteer-core
```

## 📝 Monitoring

Monitor những metrics này:
- **Cold start time**: Thời gian khởi động browser
- **Memory usage**: Không vượt quá limit  
- **Function duration**: Không timeout
- **Error rate**: Giảm thiểu lỗi Chromium

## 🚨 Emergency Fixes

Nếu vẫn gặp lỗi:

1. **Rollback dependencies**:
   ```bash
   npm install @sparticuz/chromium@131.0.0 puppeteer-core@23.8.0
   ```

2. **Increase timeout**:
   ```javascript
   // Tăng timeout cho browser launch
   timeout: 60000
   ```

3. **Simplify args**:
   ```javascript
   // Chỉ dùng args cơ bản nhất
   args: [...chromium.args, '--no-sandbox']
   ```

4. **Alternative: Playwright**
   ```bash
   npm install playwright-aws-lambda
   # Có thể thay thế Puppeteer nếu cần
   ```

---

**Updated**: September 2025  
**Status**: ✅ Working on Vercel Hobby Plan  
**Next review**: Khi có Next.js version mới hoặc @sparticuz/chromium update
