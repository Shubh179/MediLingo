# Quick Test Guide - Prescription OCR (Gemini + Tesseract)

## 🚀 Quick Start

### Option 1: With Gemini API (Recommended - Best Accuracy)

```bash
# 1. Get Gemini API Key
Visit: https://ai.google.dev/
Sign in → Get API Key → Copy

# 2. Add to frontend/.env.local
VITE_GEMINI_API_KEY=your_actual_api_key_here

# 3. Start the app
cd frontend
npm run dev
```

### Option 2: Without API Key (Tesseract Only - Still Works!)

```bash
# Just start the app - Tesseract will be used automatically
cd frontend
npm run dev
```

---

## 📸 Testing Steps

### Test 1: Upload Prescription Image

1. **Open App**: http://localhost:5173
2. **Click "Scan Prescription"** or upload section
3. **Choose image**: Select a prescription photo (JPEG, PNG)
4. **Watch progress bar**: See real-time scanning progress
5. **View results**: Extracted text appears automatically

### Test 2: Check Console Logs

**Open Browser DevTools (F12) → Console Tab**

#### With Gemini API Key:
```
Expected logs:
📸 Starting prescription scan with Gemini AI...
✅ Gemini OCR successful: [prescription text preview]
Parsed medicines: [{ name: "Medicine", dosage: "500mg", timing: "Morning" }]
```

#### Without Gemini API Key:
```
Expected logs:
⚠️ Gemini API key not configured, falling back to Tesseract
🔄 Using Tesseract OCR as fallback...
✅ Tesseract OCR successful: [prescription text preview]
Tesseract Confidence: 85.2
Parsed medicines: [...]
```

#### If Gemini Fails (Network/API Issue):
```
Expected logs:
📸 Starting prescription scan with Gemini AI...
❌ Gemini OCR failed: [error message]
🔄 Gemini unavailable, using Tesseract fallback...
✅ Tesseract OCR successful: [prescription text preview]
```

---

## 🧪 Test Scenarios

### Scenario A: Perfect Conditions (Gemini Active)
- **File**: Clear prescription photo
- **API**: Gemini key configured
- **Expected Time**: 2-4 seconds
- **Expected Accuracy**: 95-98%
- **Console**: "✅ Gemini OCR successful"

### Scenario B: No API Key (Tesseract Only)
- **File**: Clear prescription photo
- **API**: No Gemini key
- **Expected Time**: 5-10 seconds
- **Expected Accuracy**: 80-90%
- **Console**: "🔄 Using Tesseract OCR as fallback"

### Scenario C: Poor Quality Image
- **File**: Blurry/dark prescription
- **API**: Either method
- **Expected**: Both try, may show error
- **Message**: "Please upload a clearer prescription image"

### Scenario D: Network Offline (Gemini Fails)
- **File**: Any prescription
- **API**: Gemini configured but network down
- **Expected**: Auto-fallback to Tesseract
- **Result**: Still works! (Tesseract is offline-capable)

---

## 📊 What to Look For

### ✅ Success Indicators
- Progress bar animates (0% → 100%)
- Extracted text appears in UI
- Console shows "✅" checkmark
- Medicine names are parsed
- Dosages are extracted

### ⚠️ Fallback Indicators
- Console shows "🔄 Using Tesseract OCR as fallback"
- Slightly slower (5-10s vs 2-4s)
- Still completes successfully
- Text is still extracted

### ❌ Error Indicators
- Error message displayed to user
- Console shows "❌" error
- Specific error message (permissions, quality, etc.)
- Retry button available

---

## 🔍 Detailed Testing Checklist

### Pre-Upload Validation
- [ ] File type validation works (rejects non-images)
- [ ] File size check (optional, add if needed)
- [ ] Upload button is clickable

### During Scan
- [ ] Progress bar shows (0-100%)
- [ ] Loading state visible
- [ ] Can't upload another while scanning
- [ ] Console logs progress

### After Scan (Success)
- [ ] Extracted text displays
- [ ] Progress resets to 0%
- [ ] Loading state clears
- [ ] Medicine parsing works
- [ ] Can scan another prescription

### After Scan (Error)
- [ ] Error message shows
- [ ] Specific error reason given
- [ ] Retry option available
- [ ] Console logs full error

### Fallback Mechanism
- [ ] Gemini tries first (if API key exists)
- [ ] Falls back to Tesseract on Gemini failure
- [ ] Seamless transition (user doesn't notice)
- [ ] Console logs explain what happened

---

## 📝 Sample Test Prescriptions

### Good Quality (Easy):
- Typed prescription
- Clear font
- Good lighting
- No shadows
- Full prescription visible

**Expected Result:** 95%+ accuracy with Gemini, 85%+ with Tesseract

### Medium Quality (Moderate):
- Some handwriting
- Moderate lighting
- Slight shadows
- Mostly legible

**Expected Result:** 80%+ accuracy with Gemini, 70%+ with Tesseract

### Poor Quality (Challenging):
- Heavy handwriting
- Poor lighting
- Blurry
- Partial prescription

**Expected Result:** May fail, ask for clearer image

---

## 🛠️ Troubleshooting Tests

### Test: API Key Not Working
```bash
# Check 1: Verify .env.local exists
ls frontend/.env.local

# Check 2: Verify key format
cat frontend/.env.local
# Should see: VITE_GEMINI_API_KEY=AIza...

# Check 3: Restart dev server
# Stop (Ctrl+C) and restart: npm run dev
```

### Test: Slow Scanning
```bash
# Expected: 2-4s with Gemini
# Expected: 5-10s with Tesseract
# If slower:
# - Check internet connection (Gemini)
# - Check image file size (large files are slower)
# - Check console for errors
```

### Test: Inaccurate Results
```bash
# Solutions:
# 1. Retake photo with better lighting
# 2. Ensure prescription is fully in frame
# 3. Use higher resolution camera
# 4. Try scanning in landscape orientation
```

---

## 📈 Progress Bar Stages

### Gemini Flow:
```
0%   → Starting
10%  → API initialized
30%  → Converting image to base64
50%  → Sending to Gemini API
90%  → Processing response
100% → Complete
```

### Tesseract Flow:
```
0%   → Starting
10%  → Initializing Tesseract
25%  → Loading language model
30-99% → Recognizing text (real-time)
100% → Complete
```

---

## 🎯 Quick Verification

### 1-Minute Test (With Gemini)
```bash
1. Start app: npm run dev
2. Upload clear prescription image
3. Watch console: Should show "✅ Gemini OCR successful"
4. Check UI: Text appears in 2-4 seconds
✅ PASS if text extracted successfully
```

### 1-Minute Test (Without Gemini)
```bash
1. Remove VITE_GEMINI_API_KEY from .env.local
2. Restart: npm run dev
3. Upload prescription image
4. Watch console: Should show "🔄 Using Tesseract"
5. Check UI: Text appears in 5-10 seconds
✅ PASS if text extracted successfully
```

### 1-Minute Test (Fallback)
```bash
1. Set invalid API key: VITE_GEMINI_API_KEY=invalid_key
2. Upload prescription image
3. Watch console:
   - "❌ Gemini OCR failed"
   - "🔄 Using Tesseract OCR as fallback"
4. Check UI: Text appears (via Tesseract)
✅ PASS if fallback works automatically
```

---

## 🔧 Developer Console Commands

### Check API Key Status
```javascript
console.log('Gemini API Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Configured ✅' : 'Not configured ⚠️');
```

### Force Tesseract Test
```javascript
// Temporarily disable Gemini in useAiScan.ts
// Change: if (!apiKey) return null;
// To:     return null; // Force fallback
```

### Test File Upload
```javascript
const input = document.querySelector('input[type="file"]');
const file = input.files[0];
console.log('File:', file.name, file.type, file.size);
```

---

## ✅ Final Verification

### System Working Correctly If:
- [ ] Can upload prescription images
- [ ] Progress bar animates during scan
- [ ] Text is extracted and displayed
- [ ] Medicine names are parsed
- [ ] Dosages are identified
- [ ] Gemini is used when API key exists
- [ ] Tesseract fallback works without API key
- [ ] Errors are handled gracefully
- [ ] User can retry failed scans
- [ ] Console logs are informative

### Deployment Ready If:
- [ ] Works with Gemini API key
- [ ] Works without Gemini API key
- [ ] Handles network failures
- [ ] Handles poor quality images
- [ ] Progress tracking accurate
- [ ] Error messages clear
- [ ] No console errors (except expected fallback warnings)

---

## 📞 Support

### Common Issues:

**"Gemini API key not configured"**
- Expected if no API key in .env.local
- System uses Tesseract automatically
- Not an error, just a fallback

**"Could not scan prescription"**
- Image quality too poor
- Both methods failed
- Ask user to retake photo

**Slow scanning (10+ seconds)**
- Likely using Tesseract (normal)
- Or large image file
- Not an error

---

## 🎉 Success Criteria

Your implementation is working if:

1. **With Gemini**: Fast (2-4s), accurate (95%+), logs "✅ Gemini OCR successful"
2. **Without Gemini**: Works automatically with Tesseract
3. **Fallback**: Seamless switch from Gemini → Tesseract on errors
4. **User Experience**: Upload → Progress → Text extracted
5. **Error Handling**: Clear messages, retry available

---

**Ready to test!** Upload a prescription and watch the magic happen. 📸✨
