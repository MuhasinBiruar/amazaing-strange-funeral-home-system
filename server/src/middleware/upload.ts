import multer from 'multer';
import { BadRequestError } from '@/errors';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB, matching the bucket's own file_size_limit

/**
 * Parses a single uploaded file into `req.file` (memory storage — the file
 * never touches disk, since it's immediately streamed on to S3).
 *
 * @remarks
 * Mirrors the documents bucket's own `allowed_mime_types` (`image/*`,
 * `application/pdf`) and `file_size_limit`, so a mismatched upload is
 * rejected here with a clear error rather than failing opaquely at S3.
 */
export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    const isAllowed =
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf';

    if (!isAllowed) {
      callback(new BadRequestError('Only images and PDF files may be uploaded.'));
      return;
    }

    callback(null, true);
  },
}).single('file');
