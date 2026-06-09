export const DOCUMENT_UPLOAD_ACCEPT = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.pages',
  '.numbers',
  '.png',
  '.jpg',
  '.jpeg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.apple.pages',
  'application/x-iwork-pages-sffpages',
  'application/vnd.apple.numbers',
  'application/x-iwork-numbers-sffnumbers',
  'image/png',
  'image/jpeg',
].join(',');

export const DOCUMENT_UPLOAD_HELPER_TEXT = 'PDF, DOC, Pages, Numbers, TXT, or images (max 20MB)';

const APPLE_IWORK_MIME_TYPES: Record<string, string> = {
  pages: 'application/vnd.apple.pages',
  numbers: 'application/vnd.apple.numbers',
};

export const getDocumentExtension = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase().trim();
  return extension || 'bin';
};

export const getDocumentMimeType = (file: File): string => {
  if (file.type) return file.type;
  return APPLE_IWORK_MIME_TYPES[getDocumentExtension(file.name)] || 'application/octet-stream';
};
