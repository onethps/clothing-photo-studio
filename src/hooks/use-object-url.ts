import { useEffect, useState } from "react";

/**
 * Custom hook to manage object URL lifecycle for Blob/File sources.
 * Automatically cleans up the object URL upon unmount or source change.
 * Prevents memory leaks and removes manual useEffect boilerplate from components.
 */
export function useObjectUrl(source: Blob | File | null): string {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (!source) {
      setUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(source);
    setUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  return url;
}
