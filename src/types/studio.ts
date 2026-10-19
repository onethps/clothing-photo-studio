export type IconName =
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

export type ViewMode = "slider" | "split";

export interface ServerStatusResponse {
  configured: boolean;
}
