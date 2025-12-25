import { Router } from 'express';
import multer from 'multer';
import { chatFromAudio, transcribeOnly } from '../controllers/voiceController';

const router = Router();

// Use memory storage to get Buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

// POST /api/voice/chat  (multipart/form-data with field "audio")
router.post('/chat', upload.single('audio'), chatFromAudio);

// POST /api/voice/transcribe (multipart/form-data with field "audio")
router.post('/transcribe', upload.single('audio'), transcribeOnly);

export default router;
