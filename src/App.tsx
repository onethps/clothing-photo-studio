import { useEffect, useRef, useState } from "react";

type IconName =
  | "upload"
  | "sparkles"
  | "download"
  | "arrow"
  | "check"
  | "image"
  | "close"
  | "refresh"
  | "compare"
  | "split";

const paths: Record<IconName, string> = {
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5",
  sparkles:
    "m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3M20 2v4m-2-2h4",
  download: "M12 3v13m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  image:
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m-2 14 6-6 4 4 3-3 5 5M8 7h.01",
  close: "m6 6 12 12M6 18 18 6",
  refresh: "M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4m-4 4a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4",
  compare: "M8 7h8m-8 5h8m-8 5h8M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z",
  split: "M9 3v18M15 3v18M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z",
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const [sample, setSample] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<"slider" | "split">("slider");
  const [sliderPos, setSliderPos] = useState(50);
  const isDraggingSlider = useRef(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const selection = useRef<File | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!result) {
      setResultUrl("");
      return;
    }
    const url = URL.createObjectURL(result);
    setResultUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  useEffect(() => {
    const controller = new AbortController();
    void checkConnection(controller.signal);
    return () => {
      controller.abort();
      request.current?.abort();
    };
  }, []);

  // Support pasting image from clipboard (Cmd+V / Ctrl+V)
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (busy) return;
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            void chooseFile(pastedFile);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [busy]);

  async function checkConnection(signal?: AbortSignal) {
    try {
      const response = await fetch("/api/status", { signal });
      if (!response.ok) throw new Error("The editing server is unavailable.");
      const status: { configured: boolean } = await response.json();
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

  function loadImage(source: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(source);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("This photo cannot be opened. Try exporting it as JPEG again."));
      };
      img.src = url;
    });
  }

  const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024; // 3.5 MB, strictly below Vercel's 4.5 MB limit
  const MAX_DIMENSION = 2048; // Crisp 2K resolution

  async function prepareImageForUpload(fileToUpload: File): Promise<File> {
    let img: HTMLImageElement;
    try {
      img = await loadImage(fileToUpload);
    } catch {
      return fileToUpload;
    }

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (fileToUpload.size <= MAX_UPLOAD_BYTES && width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
      return fileToUpload;
    }

    let targetWidth = width;
    let targetHeight = height;
    if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
      if (targetWidth >= targetHeight) {
        targetHeight = Math.max(1, Math.round((targetHeight * MAX_DIMENSION) / targetWidth));
        targetWidth = MAX_DIMENSION;
      } else {
        targetWidth = Math.max(1, Math.round((targetWidth * MAX_DIMENSION) / targetHeight));
        targetHeight = MAX_DIMENSION;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fileToUpload;

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const jpegBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );

    if (!jpegBlob) return fileToUpload;

    const nextName = fileToUpload.name.replace(/\.[^.]+$/, ".jpg");
    return new File([jpegBlob], nextName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  async function parseErrorResponse(response: Response): Promise<string> {
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

  async function chooseFile(next: File | undefined) {
    if (!next || busy) return;
    selection.current = next;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) {
      setError(
        "Choose a JPEG, PNG, or WebP photo. Export HEIC photos as JPEG first.",
      );
      return;
    }
    if (!next.size || next.size > 20 * 1024 * 1024) {
      setError("Choose a photo smaller than 20 MB.");
      return;
    }
    try {
      await loadImage(next);
    } catch {
      if (selection.current === next)
        setError(
          "This photo cannot be opened. Try exporting it as JPEG again.",
        );
      return;
    }
    if (selection.current !== next) return;
    setFile(next);
    setResult(null);
    setSample(false);
    setError("");
  }

  function resetPhoto() {
    if (busy) return;
    selection.current = null;
    setFile(null);
    setResult(null);
    setSample(false);
    setError("");
  }

  async function convertPhoto() {
    if (!file || busy || !connected) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");

    try {
      const optimizedFile = await prepareImageForUpload(file);
      const form = new FormData();
      form.set("image", optimizedFile);
      form.set("mode", "natural");

      const response = await fetch("/api/edit", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      if (!response.ok) {
        const message = await parseErrorResponse(response);
        throw new Error(message);
      }
      if (!response.headers.get("content-type")?.startsWith("image/jpeg"))
        throw new Error("The server did not return a photo. Please try again.");

      const blob = await response.blob();
      const img = await loadImage(blob);

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error(
          "Your browser could not prepare the download. Try another browser.",
        );
      }
      context.drawImage(img, 0, 0);

      const jpeg = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.95),
      );
      if (!jpeg)
        throw new Error(
          "The JPEG download could not be prepared. Please try again.",
        );
      setResult(jpeg);
      setSliderPos(50);
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : "The edit could not be completed. Please try again.",
        );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      request.current = null;
    }
  }

  function updateSliderPosition(clientX: number) {
    const container = sliderContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  }

  function onSliderPointerDown(event: React.PointerEvent) {
    isDraggingSlider.current = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    updateSliderPosition(event.clientX);
  }

  function onSliderPointerMove(event: React.PointerEvent) {
    if (isDraggingSlider.current) {
      updateSliderPosition(event.clientX);
    }
  }

  function onSliderPointerUp(event: React.PointerEvent) {
    isDraggingSlider.current = false;
    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {}
  }

  const activeBefore = sample ? "/examples/before.jpg" : preview;
  const activeAfter = sample ? "/examples/after.jpg" : resultUrl;
  const filename = `${file?.name.replace(/\.[^.]+$/, "") || "clothing"}-listing.jpg`;
  const hasResult = Boolean(activeAfter);
  const hasImage = Boolean(activeBefore);

  return (
    <div className="studio-root">
      {/* Top Header */}
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
            <span className={`status-pill ${connected ? "online" : connected === false ? "offline" : ""}`}>
              <span className="status-dot" />
              {connected === null
                ? "Connecting..."
                : connected
                  ? "Studio Ready"
                  : "API Offline"}
            </span>

            {hasResult && !sample && (
              <a
                className="action-btn download-btn"
                href={resultUrl}
                download={filename}
                title="Download listing photo (JPEG)"
              >
                <Icon name="download" size={17} />
                <span>Download JPEG</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="studio-main">
        {/* Hero Title */}
        <section className="hero-banner">
          <div className="hero-tag">
            <Icon name="sparkles" size={14} />
            <span>ONE-CLICK AI ENHANCEMENT</span>
          </div>
          <h1 className="hero-title">Your clothes, ready for listing.</h1>
          <p className="hero-subtitle">
            Flattens creases, boosts natural wood floor contrast, and cleans distracting edges.
          </p>
        </section>

        {/* Global Error Notice */}
        {error ? (
          <div className="error-toast" role="alert">
            <span className="error-icon">!</span>
            <span>{error}</span>
            <button className="error-dismiss" onClick={() => setError("")} aria-label="Dismiss error">
              <Icon name="close" size={14} />
            </button>
          </div>
        ) : null}

        {/* Studio Center Stage */}
        <div className="stage-card">
          {/* File Input (Hidden) */}
          <input
            ref={input}
            id="photo-upload-input"
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              void chooseFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          {!hasImage ? (
            /* STATE 1: Empty Dropzone */
            <div
              className={`hero-dropzone ${dragging ? "dragging" : ""}`}
              onClick={() => input.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void chooseFile(event.dataTransfer.files[0]);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  input.current?.click();
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setSample(true);
                    }}
                  >
                    <Icon name="sparkles" size={14} />
                    <span>See before & after example</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STATE 2 & 3: Photo Loaded or Converted */
            <div className="canvas-wrapper">
              {/* Canvas Toolbar */}
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
                      <span className="file-name" title={file.name}>{file.name}</span>
                      <span className="file-size">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </span>
                  ) : null}
                </div>

                <div className="canvas-view-controls">
                  {hasResult && (
                    <div className="view-mode-toggle">
                      <button
                        type="button"
                        className={`toggle-option ${viewMode === "slider" ? "active" : ""}`}
                        onClick={() => setViewMode("slider")}
                        title="Interactive Slider Comparison"
                      >
                        <Icon name="compare" size={15} />
                        <span>Slider</span>
                      </button>
                      <button
                        type="button"
                        className={`toggle-option ${viewMode === "split" ? "active" : ""}`}
                        onClick={() => setViewMode("split")}
                        title="Side-by-side View"
                      >
                        <Icon name="split" size={15} />
                        <span>Side by Side</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="reset-btn"
                    disabled={busy}
                    onClick={resetPhoto}
                    title="Upload another photo"
                  >
                    <Icon name="close" size={15} />
                    <span>Change Photo</span>
                  </button>
                </div>
              </div>

              {/* Viewer Area */}
              <div className="viewer-stage">
                {hasResult ? (
                  /* Comparison View (Slider or Split) */
                  viewMode === "slider" ? (
                    <div
                      ref={sliderContainerRef}
                      className="slider-comparison"
                      onPointerDown={onSliderPointerDown}
                      onPointerMove={onSliderPointerMove}
                      onPointerUp={onSliderPointerUp}
                    >
                      {/* Before (Original) Layer */}
                      <img
                        src={activeBefore}
                        alt="Original uploaded garment"
                        className="slider-img base-layer"
                        draggable={false}
                      />

                      {/* After (Converted) Clipped Layer */}
                      <div
                        className="slider-clipped"
                        style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                      >
                        <img
                          src={activeAfter}
                          alt="Studio converted garment"
                          className="slider-img"
                          draggable={false}
                        />
                      </div>

                      {/* Draggable Divider Handle */}
                      <div
                        className="slider-divider"
                        style={{ left: `${sliderPos}%` }}
                      >
                        <div className="slider-handle">
                          <span className="handle-arrows">⟨ ⟩</span>
                        </div>
                      </div>

                      {/* Floating Badges */}
                      <span className="badge-tag tag-left">ORIGINAL</span>
                      <span className="badge-tag tag-right">STUDIO CONVERTED</span>
                    </div>
                  ) : (
                    /* Side-by-Side Split View */
                    <div className="split-comparison">
                      <figure className="split-card">
                        <figcaption>
                          <span className="card-dot" />
                          <span>Original Photo</span>
                        </figcaption>
                        <div className="split-frame">
                          <img src={activeBefore} alt="Original clothing photo" />
                        </div>
                      </figure>
                      <figure className="split-card highlight">
                        <figcaption>
                          <span className="card-dot green" />
                          <span>Studio Converted</span>
                        </figcaption>
                        <div className="split-frame">
                          <img src={activeAfter} alt="Studio converted listing photo" />
                        </div>
                      </figure>
                    </div>
                  )
                ) : (
                  /* Single Preview Before Conversion */
                  <div className="single-preview">
                    <div className="preview-frame">
                      <img src={activeBefore} alt="Clothing to convert" />
                    </div>
                    {busy && (
                      <div className="processing-overlay" role="status">
                        <div className="pulsing-halo" />
                        <span className="studio-spinner" />
                        <h3>Converting your photo</h3>
                        <p>Steaming creases, tuning rich wood contrast & cleaning borders…</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Single Convert Action Button Bar */}
              <div className="stage-actions-bar">
                {!hasResult && (
                  <button
                    type="button"
                    className="convert-btn-primary"
                    disabled={busy || !connected || !file}
                    onClick={() => void convertPhoto()}
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
                )}

                {hasResult && (
                  <div className="result-actions-row">
                    <button
                      type="button"
                      className="action-btn secondary-btn"
                      onClick={resetPhoto}
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
                        onClick={() => input.current?.click()}
                      >
                        <Icon name="upload" size={18} />
                        <span>Try Your Own Photo</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights Footer */}
        <section className="features-ribbon">
          <div className="feature-item">
            <span className="feature-icon"><Icon name="check" size={16} /></span>
            <div>
              <strong>Wrinkle-Free Steam</strong>
              <p>Eliminates temporary fold lines, creases, and crumpled fabric.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon"><Icon name="check" size={16} /></span>
            <div>
              <strong>Rich Floor Contrast</strong>
              <p>Preserves deep wood plank seams, grain depth, and natural tones.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon"><Icon name="check" size={16} /></span>
            <div>
              <strong>Zero Inventions</strong>
              <p>Authentic logos, brand graphics, and true wear are 100% preserved.</p>
            </div>
          </div>
        </section>

        {/* Connection Setup Hint (Only shown when disconnected) */}
        {!connected && connected !== null ? (
          <div className="setup-banner">
            <div className="setup-header">
              <span className="setup-alert">!</span>
              <strong>Connect Gemini API to start editing</strong>
            </div>
            <p>
              Ensure <code>VITE_APP_GEMINI_API_KEY</code> is set in your <code>.env</code> file
              and restart the dev server with <code>yarn dev</code>.
            </p>
            <button
              type="button"
              className="retry-connection-btn"
              onClick={() => void checkConnection()}
            >
              Check connection again
            </button>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="studio-footer">
        <span>Rewear Studio · Instant AI Clothing Photography</span>
        <span>Built for sellers on OLX, Shafa & Vinted</span>
      </footer>
    </div>
  );
}
