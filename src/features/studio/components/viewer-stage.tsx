import { ViewMode } from "@/types/studio";
import { SliderView } from "./slider-view";
import { SplitView } from "./split-view";

interface ViewerStageProps {
  hasResult: boolean;
  viewMode: ViewMode;
  activeBefore: string;
  activeAfter: string;
  busy: boolean;
}

export function ViewerStage({
  hasResult,
  viewMode,
  activeBefore,
  activeAfter,
  busy,
}: ViewerStageProps) {
  return (
    <div className="viewer-stage">
      {hasResult ? (
        viewMode === "slider" ? (
          <SliderView
            activeBefore={activeBefore}
            activeAfter={activeAfter}
            initialPos={50}
          />
        ) : (
          <SplitView
            activeBefore={activeBefore}
            activeAfter={activeAfter}
          />
        )
      ) : (
        <div className="single-preview">
          <div className="preview-frame">
            <img src={activeBefore} alt="Clothing to convert" />
          </div>
          {busy ? (
            <div className="processing-overlay" role="status">
              <div className="pulsing-halo" />
              <span className="studio-spinner" />
              <h3>Converting your photo</h3>
              <p>
                Steaming creases, tuning rich wood contrast & cleaning borders…
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
