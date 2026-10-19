interface SetupBannerProps {
  connected: boolean | null;
  onRetry: () => void;
}

export function SetupBanner({ connected, onRetry }: SetupBannerProps) {
  if (connected !== false) return null;

  return (
    <div className="setup-banner">
      <div className="setup-header">
        <span className="setup-alert">!</span>
        <strong>Connect Gemini API to start editing</strong>
      </div>
      <p>
        Ensure <code>VITE_GEMINI_API_KEY</code> is set in your <code>.env</code>{" "}
        file and restart the dev server with <code>yarn dev</code>.
      </p>
      <button
        type="button"
        className="retry-connection-btn"
        onClick={onRetry}
      >
        Check connection again
      </button>
    </div>
  );
}
