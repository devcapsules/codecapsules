import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ToastNotificationProps {
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function ToastNotification({
  type,
  title,
  message,
  isVisible,
  onClose,
  duration = 4000
}: ToastNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isAnimating) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      case 'error':
        return 'text-red-800';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-lg border p-4 shadow-lg ${getBgColor()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h4 className={`text-sm font-semibold ${getTextColor()}`}>
              {title}
            </h4>
            <p className={`text-sm mt-1 ${getTextColor()}`}>
              {message}
            </p>
          </div>
          <button
            onClick={() => {
              setIsAnimating(false);
              setTimeout(onClose, 300);
            }}
            className={`flex-shrink-0 ${getTextColor()} hover:opacity-70`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface SuccessToastProps {
  isVisible: boolean;
  onClose: () => void;
  qualityScore?: number;
}

export function SuccessToast({ isVisible, onClose, qualityScore }: SuccessToastProps) {
  return (
    <ToastNotification
      type="success"
      title="Capsule Generated!"
      message={`Successfully generated with ${qualityScore ? `quality score: ${qualityScore}%` : 'AI content'}. Ready to save or embed.`}
      isVisible={isVisible}
      onClose={onClose}
    />
  );
}

interface ErrorToastProps {
  isVisible: boolean;
  onClose: () => void;
  error: string;
}

export function ErrorToast({ isVisible, onClose, error }: ErrorToastProps) {
  return (
    <ToastNotification
      type="error"
      title="Generation Failed"
      message={error}
      isVisible={isVisible}
      onClose={onClose}
      duration={6000}
    />
  );
}