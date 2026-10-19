import { useEffect, useState } from "react";
import { fetchServerStatus } from "@/lib/api-client";

interface UseServerStatusResult {
  connected: boolean | null;
  error: string;
  checkConnection: (signal?: AbortSignal) => Promise<void>;
  clearError: () => void;
}

export function useServerStatus(): UseServerStatusResult {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");

  async function checkConnection(signal?: AbortSignal) {
    try {
      const status = await fetchServerStatus(signal);
      if (!signal?.aborted) {
        setConnected(status.configured);
        setError("");
      }
    } catch {
      if (!signal?.aborted) {
        setConnected(false);
        setError(
          "Cannot reach the editing server. Restart the studio and check again.",
        );
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void checkConnection(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  function clearError() {
    setError("");
  }

  return {
    connected,
    error,
    checkConnection,
    clearError,
  };
}
