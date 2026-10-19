export const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024; // 3.5 MB, strictly below Vercel's 4.5 MB limit
export const MAX_DIMENSION = 2048; // Crisp 2K resolution
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB max client file input size

export const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];
