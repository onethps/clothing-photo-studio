import { StatusPill } from "@/components/feedback/status-pill";
import { Icon } from "@/components/ui/icon";

interface StudioHeaderProps {
  connected: boolean | null;
  hasResult: boolean;
  sample: boolean;
  resultUrl: string;
  filename: string;
}

export function StudioHeader({
  connected,
  hasResult,
  sample,
  resultUrl,
  filename,
}: StudioHeaderProps) {
  const showDownload = hasResult && !sample;

  return (
    <header className="studio-header">
      <div className="header-inner">
        <a className="brand" href="/" aria-label="Rewear photo studio home">
          <span className="brand-gem">
            <Icon name="sparkles" size={18} />
          </span>
          <div className="brand-text">
            <span className="brand-title">rewear</span>
            <span className="brand-badge">STUDIO</span>
          </div>
        </a>

        <div className="header-actions">
          <StatusPill connected={connected} />

          {showDownload ? (
            <a
              className="action-btn download-btn"
              href={resultUrl}
              download={filename}
              title="Download listing photo (JPEG)"
            >
              <Icon name="download" size={17} />
              <span>Download JPEG</span>
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
