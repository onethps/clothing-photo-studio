import { Icon } from "@/components/ui/icon";

interface StageActionsProps {
  hasResult: boolean;
  busy: boolean;
  connected: boolean | null;
  file: File | null;
  sample: boolean;
  resultUrl: string;
  filename: string;
  onConvertPhoto: () => void;
  onResetPhoto: () => void;
  onTriggerFileSelect: () => void;
}

export function StageActions({
  hasResult,
  busy,
  connected,
  file,
  sample,
  resultUrl,
  filename,
  onConvertPhoto,
  onResetPhoto,
  onTriggerFileSelect,
}: StageActionsProps) {
  return (
    <div className="stage-actions-bar">
      {!hasResult ? (
        <button
          type="button"
          className="convert-btn-primary"
          disabled={busy || !connected || !file}
          onClick={onConvertPhoto}
        >
          {busy ? (
            <>
              <span className="studio-spinner" />
              <span>Converting Photo…</span>
            </>
          ) : (
            <>
              <Icon name="sparkles" size={20} />
              <span>Convert Photo</span>
            </>
          )}
        </button>
      ) : (
        <div className="result-actions-row">
          <button
            type="button"
            className="action-btn secondary-btn"
            onClick={onResetPhoto}
          >
            <Icon name="refresh" size={17} />
            <span>Upload Another Photo</span>
          </button>

          {!sample ? (
            <a
              className="action-btn primary-download-btn"
              href={resultUrl}
              download={filename}
            >
              <Icon name="download" size={19} />
              <span>Download Listing JPEG</span>
            </a>
          ) : (
            <button
              type="button"
              className="action-btn primary-download-btn"
              onClick={onTriggerFileSelect}
            >
              <Icon name="upload" size={18} />
              <span>Try Your Own Photo</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
