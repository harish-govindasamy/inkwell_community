import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

const LoadingSpinner = ({
  size = "md",
  text = "Loading...",
  fullScreen = false,
  timeout = 10000,
  onTimeout = null,
}) => {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (timeout && timeout > 0) {
      const timer = setTimeout(() => {
        setShowTimeout(true);
        if (onTimeout) onTimeout();
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [timeout, onTimeout]);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const handleRetry = () => {
    setShowTimeout(false);
    window.location.reload();
  };

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          {!showTimeout ? (
            <>
              <Loader2
                className={`${sizeClasses[size]} text-indigo-600 animate-spin mx-auto mb-4`}
              />
              <p
                className={`${textSizeClasses[size]} text-gray-600 font-medium`}
              >
                {text}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                This may take a moment...
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Taking longer than expected
              </h3>
              <p className="text-gray-600 mb-6">
                The application is taking longer to load than usual. This might
                be due to network issues or server delays.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </button>
                <button
                  onClick={() => (window.location.href = "/login")}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        {!showTimeout ? (
          <>
            <Loader2
              className={`${sizeClasses[size]} text-indigo-600 animate-spin mx-auto mb-2`}
            />
            <p className={`${textSizeClasses[size]} text-gray-600`}>{text}</p>
          </>
        ) : (
          <>
            <AlertCircle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Loading timeout</p>
            <button
              onClick={handleRetry}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
