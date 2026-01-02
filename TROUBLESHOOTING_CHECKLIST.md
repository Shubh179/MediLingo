# 🔧 Troubleshooting Checklist

## Pre-Start Checklist

### Backend Setup
- [ ] Navigate to `e:\MediLingo\server`
- [ ] Check `.env` file exists with:
  - [ ] `MONGODB_URI=...` (not empty)
  - [ ] `SESSION_SECRET=...` (not empty)
  - [ ] `PORT=5001`
  - [ ] `NODE_ENV=development`
- [ ] Node modules installed: `ls node_modules` shows folders
  - If not: Run `npm install`

### Frontend Setup
- [ ] Navigate to `e:\MediLingo\frontend`
- [ ] Node modules installed: `ls node_modules` shows folders
  - If not: Run `npm install`
- [ ] `vite.config.ts` exists
- [ ] `src/main.tsx` exists

## Start-Up Checklist

### Backend Startup
```bash
cd e:\MediLingo\server
npm start
```

Look for these messages:
- [ ] `🚀 Server running in development mode on port 5001`
- [ ] `📡 API available at http://0.0.0.0:5001`
- [ ] `✅ Database connection successful` (or similar)

**If you see ❌ errors:**
- [ ] Check MongoDB URI is valid
  ```bash
  # Test MongoDB connection
  mongosh "mongodb+srv://..."  # Use your connection string
  ```
- [ ] Check port 5001 not in use
  ```bash
  netstat -ano | findstr :5001
  ```
- [ ] Check .env file format (no quotes around values)

### Frontend Startup
```bash
cd e:\MediLingo\frontend
npm run dev
```

Look for:
- [ ] `Local: http://localhost:5173` (or next available port)
- [ ] No build errors
- [ ] Compilation successful message

**If you see ❌ errors:**
- [ ] Clear node_modules: `rmdir /s node_modules`
- [ ] Reinstall: `npm install`
- [ ] Clear vite cache: `rmdir /s .vite`

## Testing Checklist

### 1. Server Health Check

**In browser console:**
```javascript
fetch('http://localhost:5001/')
  .then(r => r.text())
  .then(text => console.log(text))
```

Should return: "MediLingo API is running..."

### 2. Female User Flow

#### Step 1: Register
- [ ] Go to `http://localhost:5173`
- [ ] Click "Sign Up"
- [ ] Fill form:
  - [ ] Email: `test.female@example.com`
  - [ ] Password: `Test@1234` (min 6 chars)
  - [ ] Age: `25`
  - [ ] **Gender: Select "Female"**
- [ ] Submit
- [ ] Should see: "Welcome back, ..." toast

**Troubleshoot:**
- [ ] Network tab shows POST /api/auth/signup → 201
- [ ] Server shows no ❌ errors
- [ ] User created in MongoDB:
  ```bash
  mongosh
  use your_db_name
  db.users.findOne({email: "test.female@example.com"})
  # Should have: gender: "Female", sharingCode: "XXXXXXXX"
  ```

#### Step 2: View Profile
- [ ] Click profile icon (top-right corner)
- [ ] Dialog opens: "User Profile"
- [ ] **Verify all fields show:**
  - [ ] Name (not "Not provided")
  - [ ] Email (not "Not provided")
  - [ ] Age (not "Not provided")
  - [ ] **Sharing Code (8 characters, e.g., ABC12345)**

**Troubleshoot:**
- [ ] Browser console should show:
  ```
  📱 Fetching profile from: http://localhost:5001/api/auth/profile
  ✅ Profile data received: {...}
  👩 Fetching sharing code for female user...
  ✅ Sharing code received: {sharingCode: "ABC12345"}
  ```
- [ ] Network tab:
  - [ ] GET /api/auth/profile → 200
  - [ ] GET /api/share/code → 200
- [ ] If 401 error: Logout and login again
- [ ] If 403 error: Account must be Female

#### Step 3: Copy Sharing Code
- [ ] Find sharing code in dialog
- [ ] Click "Copy" button or manually copy (8 characters)
- [ ] Save code for male user testing

### 3. Male User Flow

#### Step 1: Register
- [ ] Logout from female account
- [ ] Click "Sign Up"
- [ ] Fill form:
  - [ ] Email: `test.male@example.com`
  - [ ] Password: `Test@1234`
  - [ ] Age: `28`
  - [ ] **Gender: Select "Male"**
- [ ] Submit
- [ ] Should see welcome toast

**Troubleshoot:**
- [ ] Same as female user registration
- [ ] Gender must be "Male"

#### Step 2: Redeem Code
- [ ] Look for "Redeem Sharing Code" section
- [ ] Paste female user's sharing code
- [ ] Click Redeem
- [ ] Should see: "Access granted" or similar

**Troubleshoot:**
- [ ] Browser console should show no ❌ errors
- [ ] Network tab: POST /api/share/access → 200
- [ ] Server log should show success
- [ ] Code must be exactly 8 characters
- [ ] Code must match female user's sharingCode

#### Step 3: View Shared Profiles
- [ ] Stay on home page/dashboard
- [ ] Look for "Shared Profiles" section (male users only)
- [ ] Should see female user in list:
  - [ ] Name: "Tanvi Kamath" (or female user's name)
  - [ ] Age: 25 (or female user's age)

**Troubleshoot:**
- [ ] Browser console should show:
  ```
  📋 Loading shared profiles from: http://localhost:5001/api/share/profiles
  ✅ Shared profiles loaded: [{...}]
  ```
- [ ] Network tab: GET /api/share/profiles → 200
- [ ] Server log: "Found 1 shared profiles"
- [ ] If empty list: Code wasn't redeemed properly

#### Step 4: View Shared Cycle
- [ ] Click on female user from shared profiles
- [ ] Modal opens: "Viewing Shared Profile"
- [ ] Subtitle: "Read-only cycle calendar and symptoms for {Name}"
- [ ] **Content shows:**
  - [ ] Either "No cycle data saved yet." (if female hasn't set data)
  - [ ] Or cycle calendar + data (if female saved data)

**Troubleshoot:**
- [ ] Browser console should show:
  ```
  📅 Fetching shared cycle for: {userId}
  ✅ Shared cycle data received: {...}
  ```
- [ ] Network tab: GET /api/cycle/shared/{userId} → 200
- [ ] Server log: "Fetching shared cycle for user ... found/not found"
- [ ] If 403 error: Code wasn't properly redeemed
- [ ] If 401 error: Session expired, logout and login

## Common Errors & Fixes

### Error: "Not authenticated"

```
API Response:
{
  "success": false,
  "message": "Not authenticated. Please login first."
}
```

**Fixes:**
1. Logout: Browser → Dev Tools → Application → Cookies → Delete `medilingo_session`
2. Login again
3. Restart backend + frontend
4. Check .env: `SESSION_SECRET` must be set

### Error: "Sharing code available only for female users"

```
Status: 403
Message: "Sharing code available only for female users"
```

**Causes & Fixes:**
1. Registered as Male instead of Female
   - Create new account with Female gender
2. Account gender wrong in database
   - Check MongoDB: `db.users.findOne({email: "..."}).gender`
   - If wrong: Update via backend or re-register

### Error: "No access to this profile"

```
Status: 403
Message: "No access to this profile"
```

**Fixes:**
1. Must redeem code first: POST /api/share/access
2. Code must match exactly (case-sensitive, 8 chars)
3. Male user must have female user ID in `sharedAccessList`
   - Check: `db.users.findOne({_id: ObjectId("male_id")}).sharedAccessList`

### Error: CORS Error

```
Access to XMLHttpRequest from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Fixes:**
1. Restart backend: Kill and `npm start` again
2. Check FRONTEND_URL in server/.env:
   ```
   FRONTEND_URL=http://localhost:5173
   ```
3. Clear frontend cache:
   ```bash
   cd frontend
   rmdir /s .vite
   npm run dev
   ```

### Error: Port Already in Use

```
❌ Port 5001 is already in use
```

**Fixes:**
1. Kill process on port 5001:
   ```bash
   netstat -ano | findstr :5001
   taskkill /PID {PID} /F
   ```
2. Change port in .env: `PORT=5002`

### Error: MongoDB Connection Failed

```
MongoNetworkError: connect ECONNREFUSED
```

**Fixes:**
1. Check MONGODB_URI in .env is correct
2. Test connection:
   ```bash
   mongosh "mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0"
   ```
3. Whitelist your IP in MongoDB Atlas
4. Check internet connection

## Performance Checks

### Network Tab - Expected Responses

```
Profile Fetch:
GET /api/auth/profile
Status: 200
Response Time: <100ms
Response: {"success": true, "user": {...}}

Sharing Code Fetch:
GET /api/share/code
Status: 200
Response Time: <50ms
Response: {"success": true, "sharingCode": "ABC12345"}

Shared Profiles:
GET /api/share/profiles
Status: 200
Response Time: <200ms (includes DB lookup + populate)
Response: {"success": true, "profiles": [...]}

Shared Cycle:
GET /api/cycle/shared/{id}
Status: 200
Response Time: <100ms
Response: {"success": true, "user": {...}, "cycle": {...}}
```

### Console Warnings (OK to ignore)

These are expected and safe:
```
⚠️ [Vite] named imports not supported...
⚠️ Accessing ReactDOM internals...
⚠️ Browser timezone mismatch...
```

### Console Errors (NOT OK - fix these)

```
❌ Profile fetch error: ...
❌ Not authenticated...
❌ CORS error...
❌ TypeError: Cannot read property...
```

## Final Validation

### Checklist - Everything Works

- [ ] Backend running on port 5001
- [ ] Frontend running on port 5173 (or next available)
- [ ] Female user: Can see profile + sharing code
- [ ] Male user: Can see shared profiles list
- [ ] Male user: Can view female user's cycle data
- [ ] No ❌ errors in console
- [ ] All Network requests return 200/201
- [ ] Server logs show ✅ messages
- [ ] No CORS errors
- [ ] No 401/403 authorization errors

**If all checked: 🎉 Ready for production testing!**

## Debug Commands

### Browser Console
```javascript
// Check authentication
console.log(localStorage.getItem('medilingo_user'));

// Check API endpoint
fetch('http://localhost:5001/').then(r => r.text()).then(console.log);

// Test auth profile
fetch('http://localhost:5001/api/auth/profile', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);

// Test sharing code
fetch('http://localhost:5001/api/share/code', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);

// Test shared profiles
fetch('http://localhost:5001/api/share/profiles', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

### Server Terminal
```bash
# Check if running
netstat -ano | findstr :5001

# Kill process
taskkill /PID {PID} /F

# Check MongoDB
mongosh
use medilingo_db
db.users.find()

# Check logs in real-time
npm start  # Tail the output
```

---

**Stuck?** Check these in order:
1. ✅ Browser console (look for ❌)
2. ✅ Network tab (look for non-200 status)
3. ✅ Server console (look for errors)
4. ✅ This checklist
5. ✅ COMPLETE_FIX_GUIDE.md for detailed explanations
