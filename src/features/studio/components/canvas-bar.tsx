import { Icon } from "@/components/ui/icon";
import { ViewMode } from "@/types/studio";
import { formatFileSize } from "@/utils/format";

interface CanvasBarProps {
  sample: boolean;
  file: File | null;
  hasResult: boolean;
  viewMode: ViewMode;
  busy: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onResetPhoto: () => void;
}

export function CanvasBar({
  sample,
  file,
  hasResult,
  viewMode,
  busy,
  onViewModeChange,
  onResetPhoto,
}: CanvasBarProps) {
  return (
    <div className="canvas-bar">
      <div className="canvas-info">
        {sample ? (
          <span className="file-pill sample-badge">
            <Icon name="sparkles" size={14} />
            Sample Example
          </span>
        ) : file ? (
          <span className="file-pill">
            <Icon name="image" size={14} />
            <span className="file-name" title={file.name}>
              {file.name}
            </span>
            <span className="file-size">({formatFileSize(file.size)})</span>
          </span>
        ) : null}
      </div>

      <div className="canvas-view-controls">
        {hasResult ? (
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`toggle-option ${viewMode === "slider" ? "active" : ""}`}
              onClick={() => onViewModeChange("slider")}
              title="Interactive Slider Comparison"
            >
              <Icon name="compare" size={15} />
              <span>Slider</span>
            </button>
            <button
              type="button"
              className={`toggle-option ${viewMode === "split" ? "active" : ""}`}
              onClick={() => onViewModeChange("split")}
              title="Side-by-side View"
            >
              <Icon name="split" size={15} />
              <span>Side by Side</span>
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="reset-btn"
          disabled={busy}
          onClick={onResetPhoto}
          title="Upload another photo"
        >
          <Icon name="close" size={15} />
          <span>Change Photo</span>
        </button>
      </div>
    </div>
  );
}
