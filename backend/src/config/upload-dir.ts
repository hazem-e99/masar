import { isAbsolute, join } from 'path';

/**
 * Where profile pictures are written and served from.
 * Vercel functions can only write to /tmp, so files there disappear when the instance stops.
 */
export function resolveUploadDir(): string {
  const uploadDir = process.env.VERCEL === '1'
    ? '/tmp/masar-uploads'
    : process.env.UPLOAD_DIR || './uploads';
  return isAbsolute(uploadDir) ? uploadDir : join(process.cwd(), uploadDir);
}
