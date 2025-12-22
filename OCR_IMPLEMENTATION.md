# Prescription OCR Integration with Tesseract.js

## Overview
MediLingo uses **Tesseract.js**, a free, open-source OCR (Optical Character Recognition) library to automatically extract text from prescription images. This allows users to instantly convert their prescription photos into readable text.

## How It Works

### 1. **User Flow**
```
User clicks "Scan Prescription"
    ↓
Chooses Camera or Gallery
    ↓
Selects/captures prescription image
    ↓
Image sent to OCR processing
    ↓
Tesseract.js extracts text
    ↓
Text displayed in dashboard
```

### 2. **Technical Implementation**

#### Key Files:
- **`src/hooks/useAiScan.ts`** - OCR processing hook using Tesseract.js
- **`src/pages/Index.tsx`** - Main page that handles scan flow
- **`src/components/landing/HeroSection.tsx`** - Camera/Gallery selection dialog
- **`src/components/upload/PhotoUpload.tsx`** - Image upload and preview

#### Dependencies:
```json
{
  "tesseract.js": "^7.0.0"
}
```

### 3. **How Tesseract.js Works**

Tesseract.js runs OCR entirely in the browser:

```typescript
import Tesseract from 'tesseract.js';

const result = await Tesseract.recognize(
  file,                    // Image file from user
  'eng',                   // Language (eng = English)
  {
    logger: (m) => {
      // Track progress: initializing → loading language → recognizing
      if (m.status === 'recognizing text') {
        setProgress(Math.round(m.progress * 100));
      }
    },
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,  // Auto page segmentation
    tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,  // Best accuracy
  }
);

const extractedText = result.data.text;  // OCR result
const confidence = result.data.confidence;  // Confidence score
```

### 4. **Supported Languages**

To add multilingual support, modify the language parameter in `useAiScan.ts`:

```typescript
// Single language
'eng'

// Multiple languages (better for Indian prescriptions)
'eng+hin+mar'    // English + Hindi + Marathi
'eng+hin+tam'    // English + Hindi + Tamil
'eng+hin+ben'    // English + Hindi + Bengali
'eng+hin+tel'    // English + Hindi + Telugu
'eng+hin+kan'    // English + Hindi + Kannada
'eng+hin+mal'    // English + Hindi + Malayalam
'eng+hin+guj'    // English + Hindi + Gujarati
'eng+hin+pan'    // English + Hindi + Punjabi
```

### 5. **Configuration Options**

#### Tesseract PSM (Page Segmentation Mode):
```
PSM.AUTO (default) - Automatic segmentation
PSM.SINGLE_COLUMN - Single text column
PSM.SINGLE_BLOCK - Single text block
PSM.SINGLE_LINE - Single line of text
PSM.SINGLE_WORD - Single word
```

#### Tesseract OEM (OCR Engine Mode):
```
OEM.TESSERACT_ONLY - Original Tesseract engine
OEM.LSTM_ONLY - Modern LSTM neural network (best accuracy)
OEM.TESSERACT_LSTM_COMBINED - Both engines
```

### 6. **Progress Tracking**

The OCR process shows real-time progress:

```
10% - Initializing API
25% - Loading language training data
50-99% - Recognizing text from image
100% - Complete
```

Progress is displayed in the modal dialog during scanning.

### 7. **Error Handling**

Common errors and how they're handled:

| Error | Cause | Solution |
|-------|-------|----------|
| "No text detected" | Image too blurry | Ask user to retake with better lighting |
| "File type not supported" | User uploads non-image | Validate file type before processing |
| "Language not available" | Selected language not downloaded | Falls back to English |
| "Network error" | Can't download language data | Check internet connection |

### 8. **Performance Considerations**

**Browser Processing:**
- All OCR happens on the user's device (100% privacy)
- First run: ~30-60 seconds (downloads language files: ~65MB)
- Subsequent runs: ~5-10 seconds (files cached in IndexedDB)

**Storage:**
- Language files cached in browser IndexedDB
- Users can clear browser storage to reclaim space

**Network:**
- Only needed for initial language file download
- After first use, works completely offline

### 9. **Integration Points**

#### In HeroSection.tsx:
```typescript
const handleCameraClick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected?.(file);  // Pass to parent
      onScanClick();           // Trigger scan flow
    }
  };
  input.click();
};
```

#### In Index.tsx:
```typescript
const handleFileSelected = (file: File) => {
  handleUpload(file);  // Process image with OCR
};

const handleUpload = async (file: File) => {
  const text = await scan(file);  // Tesseract.js processes
  setDecipherText(text);
  setCurrentView("dashboard");  // Show results
};
```

### 10. **Future Enhancements**

Possible improvements:
- [ ] Add handwriting recognition for doctor's notes
- [ ] Automatic medicine extraction and parsing
- [ ] Drug interaction warnings
- [ ] Integration with medical APIs for verification
- [ ] Support for prescription images in Hindi/regional languages
- [ ] Batch scanning (multiple prescriptions)
- [ ] PDF prescription support with OCR

### 11. **User Benefits**

✅ **Free** - No API costs or backend processing  
✅ **Private** - All processing happens locally in browser  
✅ **Fast** - 5-10 seconds after initial download  
✅ **Accurate** - 95%+ accuracy for printed text  
✅ **Accessible** - Works offline (after first use)  
✅ **Instant** - No server latency  

### 12. **Testing the OCR**

To test OCR functionality:

1. Click "Scan Prescription"
2. Choose "Use Camera" or "Upload from Gallery"
3. Select/take a prescription image
4. Wait for OCR to complete (progress bar shown)
5. Extracted text appears in dashboard

## References

- **Tesseract.js Documentation**: https://tesseract.projectnaptha.com/
- **GitHub**: https://github.com/naptha/tesseract.js
- **Supported Languages**: https://github.com/naptha/tesseract.js/blob/master/docs/api.md#tesseract.recognize

## Troubleshooting

**Q: OCR taking too long?**  
A: First use downloads ~65MB language files. Subsequent uses are cached.

**Q: Low accuracy for handwritten text?**  
A: Tesseract.js works best with printed text. Handwriting recognition is limited.

**Q: How to add multiple languages?**  
A: Update the language parameter in `useAiScan.ts` to `'eng+hin+mar'` etc.

**Q: Can I process PDFs?**  
A: Current implementation supports images only. PDF support requires additional library.
