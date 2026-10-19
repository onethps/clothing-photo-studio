import { useState } from "react";
import { Icon } from "@/components/ui/icon";

interface DropzoneProps {
  busy: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (file: File | undefined) => void;
  onSampleSelect: () => void;
}

export function Dropzone({
  busy,
  inputRef,
  onFileSelect,
  onSampleSelect,
}: DropzoneProps) {
  const [dragging, setDragging] = useState<boolean>(false);

  function triggerBrowse() {
    inputRef.current?.click();
  }

  return (
    <div
      className={`hero-dropzone ${dragging ? "dragging" : ""}`}
      onClick={triggerBrowse}
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const droppedFile = event.dataTransfer.files[0];
        onFileSelect(droppedFile);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          triggerBrowse();
        }
      }}
    >
      <div className="dropzone-glow" />
      <div className="dropzone-content">
        <div className="upload-circle">
          <Icon name="upload" size={32} />
        </div>
        <h2>Drop your clothing photo here</h2>
        <p className="dropzone-hint">
          or <span className="browse-link">browse files</span> from your device
        </p>
        <div className="dropzone-meta">
          <span>JPEG, PNG, WebP up to 20 MB</span>
          <span className="dot-sep">•</span>
          <span>Supports Ctrl+V paste</span>
        </div>

        <div className="sample-trigger-wrapper">
          <button
            type="button"
            className="sample-trigger-btn"
            onClick={(event) => {
              event.stopPropagation();
              onSampleSelect();
            }}
          >
            <Icon name="sparkles" size={14} />
            <span>See before & after example</span>
          </button>
        </div>
      </div>
    </div>
  );
}
