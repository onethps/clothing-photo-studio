import { API_ENDPOINTS } from "@/config/env";
import { ServerStatusResponse } from "@/types/studio";
import { parseErrorResponse } from "@/utils/error";

export async function fetchServerStatus(
  signal?: AbortSignal,
): Promise<ServerStatusResponse> {
  const response = await fetch(API_ENDPOINTS.STATUS, { signal });
  if (!response.ok) {
    throw new Error("The editing server is unavailable.");
  }
  return response.json();
}

export async function submitPhotoEdit(
  file: File,
  signal?: AbortSignal,
): Promise<Blob> {
  const form = new FormData();
  form.set("image", file);
  form.set("mode", "natural");

  const response = await fetch(API_ENDPOINTS.EDIT, {
    method: "POST",
    body: form,
    signal,
  });

  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.startsWith("image/jpeg")) {
    throw new Error("The server did not return a photo. Please try again.");
  }

  return response.blob();
}
