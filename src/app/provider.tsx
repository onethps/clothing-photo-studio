import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="studio-root" style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button
            type="button"
            className="action-btn"
            onClick={() => window.location.reload()}
            style={{ margin: "1rem auto" }}
          >
            Reload Studio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
