interface SplitViewProps {
  activeBefore: string;
  activeAfter: string;
}

export function SplitView({ activeBefore, activeAfter }: SplitViewProps) {
  return (
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
  );
}
