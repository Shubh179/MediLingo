# Quick Test Guide - Profile & Sharing Code Fix

## ⚡ Quick Start (5 minutes)

### 1. Start Backend
```bash
cd e:\MediLingo\server
npm start
```
**Expected:** `🚀 Server running in development mode on port 5001`

### 2. Start Frontend  
```bash
cd e:\MediLingo\frontend
npm run dev
```
**Expected:** `Local: http://localhost:5173`

### 3. Test Female User Profile

**Step A: Register Female User**
- Click "Sign Up"
- Email: `test_female@example.com`
- Password: `Test@1234`
- Age: `25`
- **Gender: Select "Female"**
- Click Sign Up

**Step B: Open Profile Dialog**
- Click profile icon (top-right)
- Look for dialog titled "User Profile"

**Step C: Verify Data**
| Expected | Actual | Status |
|----------|--------|--------|
| Name shows | | ✅/❌ |
| Email shows | | ✅/❌ |
| Age shows | | ✅/❌ |
| Sharing code appears | | ✅/❌ |
| Code is 8 characters | | ✅/❌ |

**Step D: Check Console**
```
Expected logs in Browser Console (F12 → Console tab):
📱 Fetching profile from: http://localhost:5001/api/auth/profile
✅ Profile data received: {...}
👩 Fetching sharing code for female user...
✅ Sharing code received: {sharingCode: "XXXXXXXX"}
```

**Step E: Check Server**
```
Expected logs in Terminal (server):
📋 Fetching shared profiles for user {id}
✅ Found 0 shared profiles
📝 Generating missing sharingCode for female user {id}
✅ Returning sharing code for female user {id}: XXXXXXXX
```

### 4. Test Male User Redeem & Shared Profile

**Step A: Register Male User**
- Logout from female account
- Click "Sign Up"  
- Email: `test_male@example.com`
- Password: `Test@1234`
- Age: `28`
- **Gender: Select "Male"**
- Click Sign Up

**Step B: Redeem Sharing Code**
- Look for "Redeem Sharing Code" section
- Enter code from female user (from Step 3)
- Click Redeem
- **Expected:** "Access granted" toast message

**Step C: View Shared Profile**
- Dashboard should show female user's profile
- Click on the profile
- Modal opens: "Viewing Shared Profile"

**Step D: Verify Shared Data**
| Expected | Actual | Status |
|----------|--------|--------|
| Female user's name shows | | ✅/❌ |
| Cycle section displays | | ✅/❌ |
| "No cycle data saved yet" message OR cycle data | | ✅/❌ |

**Step E: Check Console**
```
Expected logs in Browser Console:
📋 Loading shared profiles from: http://localhost:5001/api/share/profiles
✅ Shared profiles loaded: [{...}]
📅 Fetching shared cycle for: {userId}
✅ Shared cycle data received: {...}
```

**Step F: Check Server**
```
Expected logs in Terminal:
📋 Fetching shared profiles for user {maleId}
✅ Found 1 shared profiles for user {maleId}
📋 Fetching shared cycle for user {femaleId} from {maleId}
✅ Shared cycle data fetched: found/not found
```

## 🔴 Common Issues & Quick Fixes

### Issue 1: Profile shows "Not provided"
**Quick Fix:**
1. Check browser console for ❌ errors
2. Check Network tab: Is GET /api/auth/profile returning 200?
3. If error 401: Logout and login again
4. If error 500: Check server console for details

### Issue 2: Sharing code not appearing
**Quick Fix:**
1. Verify you registered as "Female" (not Male)
2. Logout and login again to refresh
3. Check browser console - should see 👩 and ✅ logs
4. Check server console - should see "Returning sharing code"

### Issue 3: "No shared profiles" for male user
**Quick Fix:**
1. Female user must share code first
2. Male user must redeem code first
3. Verify Network tab shows GET /api/share/profiles returning profiles list
4. Check server console - should see "Found X shared profiles"

### Issue 4: Shared cycle shows "No cycle data saved yet"
**Quick Fixes:**
1. This is NORMAL if female user hasn't saved cycle data yet
2. Female user should:
   - Go to home page
   - Find "Menstrual Cycle Tracker" section
   - Click "Save Cycle" 
   - Set lastPeriodStart date
   - Click Save
3. Male user logs out and back in
4. Try viewing shared profile again

### Issue 5: 401 or CORS errors
**Quick Fixes:**
1. **Restart both servers** (backend + frontend)
2. **Clear browser cache:** Ctrl+Shift+Delete → Clear everything
3. **Check .env file:**
   - Backend: `SESSION_SECRET` and `MONGODB_URI` should be set
   - Frontend: Should have access to backend URL (should work by default)

## 📊 Network Tab Inspection

Open DevTools → Network Tab, then:

### Female User - Profile Fetch
```
GET /api/auth/profile
Status: 200
Response: {
  "success": true,
  "user": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "age": 25,
    "gender": "Female"
  }
}
```

### Female User - Sharing Code Fetch
```
GET /api/share/code
Status: 200
Response: {
  "success": true,
  "sharingCode": "ABC12345"  // or similar 8-char code
}
```

### Male User - Shared Profiles
```
GET /api/share/profiles
Status: 200
Response: {
  "success": true,
  "profiles": [
    {
      "id": "...",
      "name": "Female User Name",
      "age": 25,
      "gender": "Female"
    }
  ]
}
```

### Male User - Shared Cycle
```
GET /api/cycle/shared/{femaleUserId}
Status: 200
Response: {
  "success": true,
  "user": {
    "id": "...",
    "name": "Female User Name"
  },
  "cycle": {
    "_id": "...",
    "periodDuration": 5,
    "cycleLength": 28,
    "lastPeriodStart": "2025-12-15T00:00:00Z"
  }
}
```

## 💡 Pro Tips

1. **Check console first:** 90% of issues show up in logs
2. **Refresh page:** F5 - Often fixes state issues
3. **Check Network:** See exact API responses
4. **Server logs:** Shows what's happening on backend
5. **Two browsers:** Use Chrome for male, Firefox for female (same machine testing)

## 🎯 Success Checklist

- [ ] Female user can see name, email, age
- [ ] Female user can see 8-char sharing code
- [ ] Male user can redeem female user's code
- [ ] Male user can see female user in shared profiles
- [ ] Male user can open shared profile modal
- [ ] Cycle data shows (or "No data saved" if empty)
- [ ] No red errors in console
- [ ] Server logs show ✅ messages
- [ ] All Network requests return 200/201 status

**If all checks pass: 🎉 Fix is working!**
