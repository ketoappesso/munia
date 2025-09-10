/**
 * Client-side version of fileNameToUrl
 * The database only stores the `fileName` of the files (image/video),
 * use this function to get the full TOS URL of the file.
 *
 * @param fileName The filename of the image or video.
 * @returns The full URL of the image or video.
 */
export function fileNameToUrlClient(fileName: string | null) {
  if (!fileName) return null;
  
  // Check if it's already a full URL
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
    return fileName;
  }
  
  // Use the TOS domain for client-side URL generation
  const bucket = 'xiaoyuan-chat';
  const endpoint = 'tos-cn-guangzhou.volces.com';
  
  return `https://${bucket}.${endpoint}/${fileName}`;
}