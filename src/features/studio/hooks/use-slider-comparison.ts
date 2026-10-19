import { useRef, useState } from "react";

interface UseSliderComparisonOptions {
  initialPos?: number;
}

interface UseSliderComparisonResult {
  sliderPos: number;
  setSliderPos: (pos: number) => void;
  sliderContainerRef: React.RefObject<HTMLDivElement | null>;
  onSliderPointerDown: (event: React.PointerEvent) => void;
  onSliderPointerMove: (event: React.PointerEvent) => void;
  onSliderPointerUp: (event: React.PointerEvent) => void;
}

export function useSliderComparison({
  initialPos = 50,
}: UseSliderComparisonOptions = {}): UseSliderComparisonResult {
  const [sliderPos, setSliderPos] = useState<number>(initialPos);
  const isDraggingSlider = useRef<boolean>(false);
  const sliderContainerRef = useRef<HTMLDivElement | null>(null);

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
    } catch {
      // Element might have been unmounted or detached
    }
  }

  return {
    sliderPos,
    setSliderPos,
    sliderContainerRef,
    onSliderPointerDown,
    onSliderPointerMove,
    onSliderPointerUp,
  };
}
