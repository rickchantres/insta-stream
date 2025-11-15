import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

export const config = {
  port: process.env.PORT || 3000,
  uploadDir: process.env.UPLOAD_DIR || join(rootDir, 'uploads'),
  streamDir: process.env.STREAM_DIR || join(rootDir, 'stream'),
  hlsSegmentDuration: parseInt(process.env.HLS_SEGMENT_DURATION) || 2,
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE) || 500, // MB
};
