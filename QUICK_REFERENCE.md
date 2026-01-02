# 🎯 Quick Reference Card

## 🚀 Start Application

```bash
# Terminal 1 - Backend
cd e:\MediLingo\server
npm start
# Expect: 🚀 Server running on port 5001

# Terminal 2 - Frontend  
cd e:\MediLingo\frontend
npm run dev
# Expect: Local: http://localhost:5173
```

## 🧪 Quick Test (5 min)

### Female User
1. Sign up: Gender = **Female** ✅
2. Open profile dialog
3. Should see: Name ✅ | Email ✅ | Age ✅ | Code ✅
4. Browser console: Shows ✅ logs (no ❌)

### Male User
1. Sign up: Gender = **Male** ✅
2. Enter female's code
3. Click Redeem
4. See shared profiles ✅
5. Click profile → see cycle data ✅

## 🔍 Debug Checklist

### Browser Console (F12)
```
Look for these ✅ logs:
📱 Fetching profile...
✅ Profile data received
👩 Fetching sharing code...
✅ Sharing code received
📋 Loading shared profiles...
✅ Shared profiles loaded
📅 Fetching shared cycle...
✅ Shared cycle data received

If you see ❌ errors, check TROUBLESHOOTING_CHECKLIST.md
```

### Network Tab (F12)
```
All requests should return 200/201:
✅ GET /api/auth/profile → 200
✅ GET /api/share/code → 200
✅ GET /api/share/profiles → 200
✅ GET /api/cycle/shared/{id} → 200
```

### Server Terminal
```
Should show ✅ messages:
✅ Successfully fetched profile
✅ Returning sharing code
✅ Found 2 shared profiles
✅ Shared cycle data fetched: found

No ❌ or unauthorized errors
```

## 🆘 Quick Fixes

| Issue | Fix |
|-------|-----|
| Profile shows "Not provided" | Logout → Login again |
| Sharing code not showing | Must be Female gender |
| Shared profiles empty | Must redeem code first |
| 401 Unauthorized | Session expired, login again |
| 403 Forbidden | No access, redeem code first |
| CORS Error | Restart backend & frontend |

## 📚 Documentation Map

| Document | Use For |
|----------|---------|
| **FIX_SUMMARY.md** | Overview of all fixes |
| **QUICK_TEST_GUIDE.md** | Step-by-step testing |
| **COMPLETE_FIX_GUIDE.md** | Detailed explanations |
| **TROUBLESHOOTING_CHECKLIST.md** | Fixing problems |
| **VISUAL_SUMMARY.md** | Understanding changes |
| **CHANGES_SUMMARY.md** | Code changes detail |

## 🔧 Code Changes (6 files)

**Backend (4 files):**
- ✅ `server/src/routes/cycleRoutes.ts` - Auth middleware
- ✅ `server/src/routes/shareRoutes.ts` - Auth middleware
- ✅ `server/src/controllers/cycleController.ts` - Logging
- ✅ `server/src/controllers/shareController.ts` - Logging

**Frontend (2 files):**
- ✅ `frontend/src/components/ProfileDialog.tsx` - Error handling
- ✅ `frontend/src/components/landing/HeroSection.tsx` - Error handling

## 🎯 Expected Results

### Female User Profile
```
✅ Name: "Tanvi Kamath"
✅ Email: "tanvi@example.com"
✅ Age: "25"
✅ Sharing Code: "ABC12345"
```

### Male User Dashboard
```
✅ Shared Profiles List: [Female User Name]
✅ When clicked: Shows cycle data or "No data saved"
✅ No errors in console
```

## 📊 API Endpoints (Protected)

```
Cycle Data:
- GET  /api/cycle/me
- PUT  /api/cycle/me
- POST /api/cycle/me/symptom
- GET  /api/cycle/shared/:userId

Sharing:
- GET  /api/share/code (Female only)
- POST /api/share/access (Male only)
- GET  /api/share/profiles (Male only)

Profile:
- GET /api/auth/profile (Protected)
```

## 💾 Data Flow

```
FEMALE
├─ Register (gender=Female)
├─ Code auto-generated
├─ Open profile → See all details
└─ Share code

MALE
├─ Register (gender=Male)
├─ Redeem code
├─ Get access
└─ View female's cycle data
```

## ✅ Validation Steps

- [ ] Backend running: `netstat -ano | findstr :5001`
- [ ] Frontend running: `http://localhost:5173` opens
- [ ] Female can see profile details
- [ ] Female has sharing code
- [ ] Male can redeem code
- [ ] Male can see shared profiles
- [ ] No console ❌ errors
- [ ] Network tab shows 200 responses
- [ ] Server logs show ✅ messages

## 🎓 Key Points

1. **Session-Based Auth**
   - Credentials include in every request
   - Server validates session

2. **Gender-Specific**
   - Female: Generate and share code
   - Male: Redeem code, view data

3. **Console Logging**
   - 📱 = Fetch start
   - ✅ = Success
   - ❌ = Error
   - ⚠️ = Warning

4. **All Protected**
   - Every endpoint requires auth
   - Sessions expire (24 hours)
   - Must relogin after expire

## 🚨 Common Issues

```
Issue: "Not provided"
→ Check console for ❌ errors
→ Check Network tab for response
→ Logout/Login again

Issue: No sharing code
→ Must be Female user
→ Check gender in DB

Issue: Can't see shared profiles
→ Must redeem code first
→ Code must be exact match

Issue: 401/403 errors
→ Session expired, login again
→ Or no access permission
```

## 🔗 Browser Console Commands

```javascript
// Test profile API
fetch('http://localhost:5001/api/auth/profile', {
  credentials: 'include'
}).then(r => r.json()).then(d => console.log(d))

// Test sharing code
fetch('http://localhost:5001/api/share/code', {
  credentials: 'include'
}).then(r => r.json()).then(d => console.log(d))

// Test shared profiles
fetch('http://localhost:5001/api/share/profiles', {
  credentials: 'include'
}).then(r => r.json()).then(d => console.log(d))

// Check local user data
console.log(JSON.parse(localStorage.getItem('medilingo_user')))
```

## 📈 Expected Performance

```
API Response Times:
- Profile fetch: <100ms ⚡
- Sharing code: <50ms ⚡
- Shared profiles: <200ms ⚡
- Shared cycle: <100ms ⚡

No performance degradation
Same speed as before
Better security
```

## 🎉 Success Criteria

✅ All of these should work:
- Female user: Profile + code visible
- Male user: Can redeem + see profiles
- Cycle data: Shows or "No data saved"
- Console: ✅ logs, no ❌ errors
- Network: All 200 responses
- Server: ✅ messages

**If yes → 🚀 Ready for production!**

---

**Print this card for quick reference!**

**Keep handy:**
- TROUBLESHOOTING_CHECKLIST.md (when issues arise)
- QUICK_TEST_GUIDE.md (for detailed testing)
- COMPLETE_FIX_GUIDE.md (for understanding)

---

**Version:** Quick Reference v1.0
**Created:** January 2, 2026
**Status:** ✅ Ready to Use
