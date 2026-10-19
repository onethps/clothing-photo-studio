import { useRef, useState } from "react";
import { MAX_FILE_SIZE_BYTES, SUPPORTED_MIME_TYPES } from "@/config/constants";
import { useClipboardPaste } from "@/hooks/use-clipboard-paste";
import { useObjectUrl } from "@/hooks/use-object-url";
import { submitPhotoEdit } from "@/lib/api-client";
import { ViewMode } from "@/types/studio";
import { getListingFilename } from "@/utils/format";
import { convertBlobToJpeg, loadImage, prepareImageForUpload } from "@/utils/image";

interface UsePhotoStudioOptions {
  onSuccess?: () => void;
}

export function usePhotoStudio({ onSuccess }: UsePhotoStudioOptions = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [sample, setSample] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("slider");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const selectionRef = useRef<File | null>(null);

  // Custom hooks to manage object URL lifecycles automatically without manual useEffects
  const previewUrl = useObjectUrl(file);
  const resultUrl = useObjectUrl(result);

  // Derived state computed during render (Vercel best practice: rerender-derived-state-no-effect)
  const activeBefore = sample ? "/examples/before.jpg" : previewUrl;
  const activeAfter = sample ? "/examples/after.jpg" : resultUrl;
  const filename = getListingFilename(file?.name);
  const hasResult = Boolean(activeAfter);
  const hasImage = Boolean(activeBefore);

  async function chooseFile(next: File | undefined) {
    if (!next || busy) return;
    selectionRef.current = next;

    if (!SUPPORTED_MIME_TYPES.includes(next.type as (typeof SUPPORTED_MIME_TYPES)[number])) {
      setError("Choose a JPEG, PNG, or WebP photo. Export HEIC photos as JPEG first.");
      return;
    }

    if (!next.size || next.size > MAX_FILE_SIZE_BYTES) {
      setError("Choose a photo smaller than 20 MB.");
      return;
    }

    try {
      await loadImage(next);
    } catch {
      if (selectionRef.current === next) {
        setError("This photo cannot be opened. Try exporting it as JPEG again.");
      }
      return;
    }

    if (selectionRef.current !== next) return;

    setFile(next);
    setResult(null);
    setSample(false);
    setError("");
  }

  // Custom hook for clipboard paste (Vercel best practice: eliminates effect in component)
  useClipboardPaste({
    enabled: !busy,
    onPasteImage: (pastedFile) => {
      void chooseFile(pastedFile);
    },
  });

  function resetPhoto() {
    if (busy) return;
    selectionRef.current = null;
    setFile(null);
    setResult(null);
    setSample(false);
    setError("");
  }

  function setSampleMode(enabled: boolean) {
    setSample(enabled);
  }

  function clearError() {
    setError("");
  }

  async function convertPhoto(connected: boolean | null) {
    if (!file || busy || !connected) return;

    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setError("");

    try {
      const optimizedFile = await prepareImageForUpload(file);
      const outputBlob = await submitPhotoEdit(optimizedFile, controller.signal);
      const jpeg = await convertBlobToJpeg(outputBlob);

      setResult(jpeg);
      onSuccess?.();
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(
          failure instanceof Error
            ? failure.message
            : "The edit could not be completed. Please try again.",
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setBusy(false);
      }
      requestRef.current = null;
    }
  }

  function triggerFileSelect() {
    inputRef.current?.click();
  }

  return {
    file,
    result,
    resultUrl,
    sample,
    busy,
    error,
    viewMode,
    inputRef,
    activeBefore,
    activeAfter,
    filename,
    hasResult,
    hasImage,
    setViewMode,
    chooseFile,
    resetPhoto,
    setSampleMode,
    convertPhoto,
    clearError,
    triggerFileSelect,
  };
}
