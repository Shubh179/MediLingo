# User Profile & Sharing Code Fetch - Fix Guide

## Issues Identified & Fixed

### 1. ✅ Missing Authentication Middleware on Share Routes
**Problem:** The `/api/share/code` endpoint was not protected with authentication middleware.

**Fix Applied:** Updated [server/src/routes/shareRoutes.ts](server/src/routes/shareRoutes.ts)
- Added `isAuthenticated` middleware to all share routes
- Now all endpoints require valid session authentication

### 2. ✅ Improved Error Handling in Frontend
**Problem:** Silent failures when fetching profile/sharing code without proper error messages.

**Fix Applied:** Updated [frontend/src/components/ProfileDialog.tsx](frontend/src/components/ProfileDialog.tsx)
- Added detailed console logging for debugging
- Added error toast notifications
- Better error messages from API responses
- Fixed dependency array to include `user` in useEffect

## What's Happening Now

### Profile Fetch Flow:
```
1. User opens ProfileDialog
2. Component checks if authenticated
3. Fetches profile from: GET /api/auth/profile
   - Returns: name, email, age
4. For Female users, fetches sharing code: GET /api/share/code
   - Returns: 8-character alphanumeric code
   - Only for users with gender='Female'
```

### Backend Process:
```
User Model Pre-save Hook:
├─ If gender = 'Female' AND no sharingCode
├─ Generate unique 8-char code
├─ Check for collisions
└─ Save to database

API Endpoint:
├─ Check authentication (session userId)
├─ Fetch user from MongoDB
├─ Verify gender = 'Female'
└─ Return sharingCode
```

## Testing Steps

### 1. Check Server is Running
```bash
cd server
npm start
# Should see: 🚀 Server running in development mode on port 5001
```

### 2. Check Frontend Connection
```bash
cd frontend
npm run dev
# Verify console shows API_BASE_URL correctly
```

### 3. Test in Browser DevTools

**Check Network Tab:**
- `GET /api/auth/profile` should return 200 with user data
- `GET /api/share/code` should return 200 with sharing code (if female)

**Check Console Tab:**
- Look for logs starting with 📱, ✅, 👩, ❌
- Should show:
  ```
  📱 Fetching profile from: http://localhost:5001/api/auth/profile
  ✅ Profile data received: {...user data...}
  👩 Fetching sharing code for female user...
  ✅ Sharing code received: {sharingCode: "ABC12345"}
  ```

## Common Issues & Solutions

### Issue: Profile shows "Not provided"
**Solution:**
1. Check if you're logged in (should see user name in top-right)
2. Check browser console for error messages (🔴 red text)
3. Verify API_BASE_URL in frontend is correct
4. Check that backend is running on port 5001

### Issue: Sharing code not showing
**Solutions:**
1. Make sure your account has `gender: 'Female'`
   - Register again with gender selection
   - Or update profile in database
2. Check console for 👩 logs - if missing, your account might be Male
3. Verify backend has authentication middleware on /api/share/code
   - Check [server/src/routes/shareRoutes.ts](server/src/routes/shareRoutes.ts)

### Issue: 401 Unauthorized on API calls
**Solutions:**
1. Ensure session cookie is being sent: Check if `credentials: 'include'` is set in fetch calls ✅ (already fixed)
2. Login again to refresh session
3. Check if server SESSION_SECRET is set in .env

### Issue: CORS errors
**Solutions:**
1. Verify FRONTEND_URL in [server/.env](server/.env) includes your frontend origin
2. Check that CORS middleware is before route handlers
3. Restart server after .env changes

## Files Modified

### Backend:
- ✅ [server/src/routes/shareRoutes.ts](server/src/routes/shareRoutes.ts) - Added authentication middleware

### Frontend:
- ✅ [frontend/src/components/ProfileDialog.tsx](frontend/src/components/ProfileDialog.tsx) - Improved error handling and logging

## Verification Checklist

- [ ] Server running on port 5001
- [ ] Frontend connecting to correct API base URL
- [ ] Can log in successfully
- [ ] Profile dialog shows name, email, age
- [ ] Female users see sharing code
- [ ] Male users don't see sharing code (expected)
- [ ] Browser console shows 📱✅ logs (no ❌ errors)
- [ ] Network tab shows 200 responses for API calls

## Next Steps

If you're still seeing "Not provided" fields:

1. **Check if data is in MongoDB:**
   ```bash
   # Open MongoDB Atlas or local Mongo client
   # Collection: users
   # Find your user by email
   # Should see: { name, email, age, gender, sharingCode? }
   ```

2. **Check API response directly:**
   ```bash
   # In browser console:
   fetch('http://localhost:5001/api/auth/profile', {
     credentials: 'include'
   }).then(r => r.json()).then(d => console.log(d))
   ```

3. **Enable more detailed logging:**
   - Uncomment console.log statements in backend controllers
   - Check [server/src/controllers/authController.ts](server/src/controllers/authController.ts)

## Reference

- Profile Dialog Component: [frontend/src/components/ProfileDialog.tsx](frontend/src/components/ProfileDialog.tsx)
- Auth Routes: [server/src/routes/authRoutes.ts](server/src/routes/authRoutes.ts)
- Share Routes: [server/src/routes/shareRoutes.ts](server/src/routes/shareRoutes.ts)
- Auth Controller: [server/src/controllers/authController.ts](server/src/controllers/authController.ts)
- Share Controller: [server/src/controllers/shareController.ts](server/src/controllers/shareController.ts)
- User Model: [server/src/models/User.ts](server/src/models/User.ts)
