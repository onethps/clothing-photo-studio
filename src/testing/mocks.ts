import { ServerStatusResponse } from "@/types/studio";

export const MOCK_SERVER_STATUS_ONLINE: ServerStatusResponse = {
  configured: true,
};

export const MOCK_SERVER_STATUS_OFFLINE: ServerStatusResponse = {
  configured: false,
};

export function createMockImageFile(
  name = "test-garment.jpg",
  type = "image/jpeg",
  sizeBytes = 1024 * 500,
): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}
