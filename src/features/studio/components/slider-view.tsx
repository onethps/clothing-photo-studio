import { useSliderComparison } from "../hooks/use-slider-comparison";

interface SliderViewProps {
  activeBefore: string;
  activeAfter: string;
  initialPos?: number;
}

export function SliderView({
  activeBefore,
  activeAfter,
  initialPos = 50,
}: SliderViewProps) {
  const {
    sliderPos,
    sliderContainerRef,
    onSliderPointerDown,
    onSliderPointerMove,
    onSliderPointerUp,
  } = useSliderComparison({ initialPos });

  return (
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
      <div className="slider-divider" style={{ left: `${sliderPos}%` }}>
        <div className="slider-handle">
          <span className="handle-arrows">⟨ ⟩</span>
        </div>
      </div>

      {/* Floating Badges */}
      <span className="badge-tag tag-left">ORIGINAL</span>
      <span className="badge-tag tag-right">STUDIO CONVERTED</span>
    </div>
  );
}
