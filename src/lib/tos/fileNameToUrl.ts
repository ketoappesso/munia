import 'server-only';
/**
 * The database only stores the `fileName` of the files (image/video),
 * use this function to get the full TOS URL of the file.
 *
 * @param fileName The filename of the image or video.
 * @returns The full URL of the image or video.
 */
export function fileNameToUrl(fileName: string | null) {
  if (!fileName) return null;
  
  const bucket = process.env.TOS_BUCKET_NAME;
  // TOS endpoint must be domain only (no protocol)
  const endpoint = (process.env.TOS_ENDPOINT || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  
  return `https://${bucket}.${endpoint}/${fileName}`;
}

