import multer from 'multer';

// Define the storage engine
const storage = multer.memoryStorage();

// Define the configuration with 50MB video file   (MAX)
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit in bytes
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed with 50MB Maximum!'));
    }
  },
});
