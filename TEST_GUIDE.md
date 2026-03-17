# 🧪 Hướng Dẫn Kiểm Tra Settings Page

## ⏰ Thời gian đợi
**Đợi 2-3 phút** để GitHub Pages rebuild xong.

## 📋 Các Bước Kiểm Tra

### 1. Mở Site và Settings Page
```
1. Mở: https://sohoavn.github.io/workflow-static-app-ai/
2. Hard refresh: Ctrl + Shift + R (Windows) hoặc Cmd + Shift + R (Mac)
3. Click menu "Settings"
```

### 2. Mở DevTools Console
```
1. Bấm F12 (hoặc Right-click → Inspect)
2. Chọn tab "Console"
3. Kiểm tra các log sau:
```

**Expected Console Logs:**
```
🚀 Workflow-as-App Platform v1.0.0
✅ Notification Manager initialized
✅ All dependencies loaded
🔄 Navigating to: settings
⚙️ Settings Page Script Loaded
📄 Page-loaded event received for settings
🚀 Initializing Settings Page...
🔍 DOM Check:
  - Form: ✓ Found
  - Container: ✓ Found
  - NotificationManager: ✓ Found
✅ Form event listener attached
📋 Rendering 0 keys
✅ Settings page initialized successfully
⚙️ Settings page ready!
```

### 3. Test Add API Key

**Input Test:**
```
API Key: AIzaSyTestKey123456789ABC
Nickname: "My Test Key"
→ Click "Add Key"
```

**Expected Result:**
```
Console:
  🔑 Add Key button clicked
  📝 Adding key: AIzaSyTest... (nickname: My Test Key)
  ✅ New key object: {id: "...", key: "...", ...}
  ✅ Key saved to localStorage
  🍞 Toast: ✓ API key added successfully! (success)
  📋 Rendering 1 keys

UI:
  ✓ Toast notification xuất hiện (góc phải trên)
  ✓ Key xuất hiện trong danh sách với badge "Active"
  ✓ Key được mask: AIzaSy****...****ABC
  ✓ Stats cập nhật: 
    - Total Keys = 1
    - Active = 1
    - Quota Exceeded = 0
    - Total Requests = 0
```

### 4. Test Persistence

```
1. Refresh trang (F5)
2. Click menu "Settings" lại
3. ✓ Key vẫn còn trong danh sách
```

### 5. Test Delete Key

```
1. Click nút "🗑️ Delete"
2. Confirm dialog xuất hiện
3. Click "OK"
4. ✓ Key biến mất
5. ✓ Stats về 0
```

## 🐛 Debug Commands (paste vào Console)

### Kiểm tra NotificationManager:
```javascript
console.log('NotificationManager:', window.notificationManager);
window.notificationManager.success('Test notification!');
```

### Kiểm tra localStorage:
```javascript
console.log('Stored keys:', JSON.parse(localStorage.getItem('gemini_api_keys') || '[]'));
```

### Kiểm tra DOM:
```javascript
console.log('Form:', document.getElementById('add-key-form'));
console.log('Container:', document.getElementById('api-keys-list'));
```

### Force Re-initialize:
```javascript
window.location.reload();
```

## 📊 Kết Quả Mong Đợi

| Test Case | Expected | Status |
|-----------|----------|--------|
| Load Settings Page | Page hiển thị form + stats | ⏳ |
| Console Logs | Tất cả logs xuất hiện đúng | ⏳ |
| NotificationManager | Toast notification hoạt động | ⏳ |
| Add Key | Key được thêm + toast + render | ⏳ |
| Stats Update | Total=1, Active=1 | ⏳ |
| Persistence | Key vẫn còn sau refresh | ⏳ |
| Delete Key | Key bị xóa + stats=0 | ⏳ |

## ✅ Nếu Tất Cả OK
Reply:
```
✅ Settings Page hoạt động hoàn hảo!
- Add Key: ✓
- Toast Notification: ✓
- Stats: ✓
- Persistence: ✓
- Delete: ✓

Screenshot: [attach screenshot]
```

## ❌ Nếu Có Lỗi
Reply với:
```
❌ Vẫn còn lỗi:

1. Test Case nào failed: [describe]
2. Console logs: [paste screenshot or text]
3. Network tab: [screenshot nếu có 404/500 errors]
4. Kết quả debug commands: [paste]
```

## 📝 Notes

1. **Favicon 404**: Đã fix, sẽ không còn lỗi này
2. **Form not found**: Đã thêm event listener với timeout 100ms
3. **NotificationManager**: Đã check tồn tại trước khi dùng
4. **Debug logging**: Rất chi tiết để dễ debug

---

🚀 **Monitor rebuild**: https://github.com/sohoavn/workflow-static-app-ai/actions

⏰ **Đợi 2-3 phút rồi test nhé!**
