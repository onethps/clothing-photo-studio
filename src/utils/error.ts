export async function parseErrorResponse(response: Response): Promise<string> {
  if (response.status === 413) {
    return "This photo is too large for cloud processing (maximum 4 MB). Please choose a smaller photo.";
  }
  if (response.status === 504) {
    return "The editing request timed out. Please try again.";
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const data: { error?: string } = await response.json();
      if (data?.error && typeof data.error === "string") {
        return data.error;
      }
    } catch {
      // Fall through to text parsing
    }
  }

  try {
    const text = (await response.text()).trim();
    if (text && !text.startsWith("<") && text.length < 200) {
      return text;
    }
  } catch {
    // Ignore text reading error
  }

  return `The server returned an error (${response.status}). Please try again.`;
}
