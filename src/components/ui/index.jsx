// Enterprise Design System Components
import React from "react";

// Button Component with variants
export const Button = ({
  variant = "primary",
  size = "medium",
  children,
  disabled = false,
  loading = false,
  icon,
  onClick,
  ...props
}) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white border-red-600",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 border-transparent",
  };

  const sizes = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`
        btn inline-flex items-center justify-center font-medium rounded-md
        transition-all duration-200 border focus:outline-none focus:ring-2
        focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50
        disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            opacity="0.25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// Input Component with validation states
export const Input = ({
  label,
  error,
  helper,
  required = false,
  disabled = false,
  type = "text",
  placeholder,
  value,
  onChange,
  ...props
}) => {
  const id = `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          input w-full transition-colors duration-200
          ${error ? "border-red-500 focus:ring-red-500" : ""}
          ${disabled ? "bg-gray-50 cursor-not-allowed" : ""}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helper && !error && <p className="text-sm text-gray-500">{helper}</p>}
    </div>
  );
};

// Card Component with elevation
export const Card = ({
  children,
  className = "",
  elevation = "medium",
  padding = "medium",
  hover = false,
}) => {
  const elevations = {
    none: "shadow-none",
    small: "shadow-sm",
    medium: "shadow-md",
    large: "shadow-lg",
    xlarge: "shadow-xl",
  };

  const paddings = {
    none: "p-0",
    small: "p-4",
    medium: "p-6",
    large: "p-8",
  };

  return (
    <div
      className={`
        card ${elevations[elevation]} ${paddings[padding]}
        ${hover ? "hover:shadow-lg transition-shadow duration-300" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Badge Component
export const Badge = ({ children, variant = "default", size = "medium" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  };

  const sizes = {
    small: "px-2 py-0.5 text-xs",
    medium: "px-2.5 py-1 text-sm",
    large: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${variants[variant]} ${sizes[size]}
      `}
    >
      {children}
    </span>
  );
};

// Loading Skeleton
export const Skeleton = ({
  width = "100%",
  height = "1rem",
  className = "",
  lines = 1,
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="bg-gray-200 rounded"
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
            marginBottom: lines > 1 ? "0.5rem" : 0,
          }}
        />
      ))}
    </div>
  );
};

export default {
  Button,
  Input,
  Card,
  Badge,
  Skeleton,
};
