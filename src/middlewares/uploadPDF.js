import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve('uploads/contracts');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files are allowed!'), false);
};

export const uploadSinglePdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB
}).single('pdf');