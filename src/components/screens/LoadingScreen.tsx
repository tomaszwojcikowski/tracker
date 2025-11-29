/**
 * LoadingScreen and ErrorScreen Components
 *
 * Display states for initial app loading and error handling.
 */

export interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

/**
 * Loading component to show while fetching data
 */
export function LoadingScreen({
  message = 'Loading...',
  subMessage = 'Loading workout schedule and exercises',
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-sys-black text-white flex items-center justify-center p-5">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="h-20 w-20 rounded-full bg-sys-surfaceHigh flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-10 h-10 text-sys-accent animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <div className="text-2xl font-bold mb-2 text-white">{message}</div>
          <div className="text-sm text-sys-onSurfaceVar">{subMessage}</div>
        </div>
      </div>
    </div>
  );
}

export interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Error component for loading failures
 */
export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-sys-black text-white flex items-center justify-center p-5">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div className="text-2xl font-bold mb-2 text-red-500">
            Failed to Load
          </div>
          <div className="text-sm text-sys-onSurfaceVar mb-6">{message}</div>
          <button
            onClick={handleRetry}
            className="h-12 px-6 rounded-xl bg-sys-accent text-white font-semibold active:scale-95 transition-transform"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
