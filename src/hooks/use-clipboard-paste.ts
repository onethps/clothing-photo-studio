import { useEffect, useRef } from "react";

interface UseClipboardPasteOptions {
  enabled?: boolean;
  onPasteImage: (file: File) => void;
}

/**
 * Custom hook to listen for pasted images from clipboard (Cmd+V / Ctrl+V).
 * Uses a ref for the callback to prevent effect re-runs on render (Vercel best practice).
 */
export function useClipboardPaste({
  enabled = true,
  onPasteImage,
}: UseClipboardPasteOptions): void {
  const onPasteImageRef = useRef(onPasteImage);
  onPasteImageRef.current = onPasteImage;

  useEffect(() => {
    if (!enabled) return;

    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            onPasteImageRef.current(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("paste", onPaste);
    };
  }, [enabled]);
}
