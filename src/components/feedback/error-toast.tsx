import { Icon } from "@/components/ui/icon";

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  if (!message) return null;

  return (
    <div className="error-toast" role="alert">
      <span className="error-icon">!</span>
      <span>{message}</span>
      <button
        className="error-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss error"
        type="button"
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
