interface StatusPillProps {
  connected: boolean | null;
}

export function StatusPill({ connected }: StatusPillProps) {
  const statusClassName = `status-pill ${
    connected === true ? "online" : connected === false ? "offline" : ""
  }`;

  const statusLabel =
    connected === null
      ? "Connecting..."
      : connected
        ? "Studio Ready"
        : "API Offline";

  return (
    <span className={statusClassName}>
      <span className="status-dot" />
      {statusLabel}
    </span>
  );
}
