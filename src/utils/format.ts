export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getListingFilename(originalName?: string): string {
  const baseName = originalName
    ? originalName.replace(/\.[^.]+$/, "")
    : "clothing";
  return `${baseName}-listing.jpg`;
}
