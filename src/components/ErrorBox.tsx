interface ErrorBoxProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorBox({ message, onRetry, onDismiss }: ErrorBoxProps) {
  const isCors = message.toLowerCase().includes("cors") || message.toLowerCase().includes("network error");

  return (
    <div className="bg-red-950/60 border border-red-700 rounded p-3 text-sm text-red-200 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1">⚠ {message}</p>
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-400 hover:text-red-200 shrink-0 text-xs">✕</button>
        )}
      </div>
      {isCors && (
        <p className="text-red-400 text-xs">
          CORS issues must be fixed on the server side. You can configure a Vite dev proxy in{" "}
          <code className="bg-black/30 px-1 rounded">vite.config.ts</code> to route requests through localhost.
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
