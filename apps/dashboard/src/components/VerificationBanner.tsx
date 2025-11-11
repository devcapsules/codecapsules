import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ValidationResult {
  rule: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface QualityData {
  score: number;
  issues: number;
  recommendations: string[];
  passesThreshold: boolean;
}

interface VerificationBannerProps {
  validation?: ValidationResult[];
  quality?: QualityData;
  isVisible: boolean;
}

export function VerificationBanner({ validation, quality, isVisible }: VerificationBannerProps) {
  if (!isVisible || (!validation && !quality)) return null;

  const errors = validation?.filter(v => v.severity === 'error' && !v.passed) || [];
  const warnings = validation?.filter(v => v.severity === 'warning' && !v.passed) || [];
  const passed = validation?.filter(v => v.passed) || [];

  const getOverallStatus = () => {
    if (errors.length > 0) return 'error';
    if (warnings.length > 0) return 'warning';
    return 'success';
  };

  const status = getOverallStatus();

  const getBannerStyles = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'success':
        return 'All Validations Passed!';
      case 'warning':
        return 'Minor Issues Detected';
      case 'error':
        return 'Critical Issues Found';
    }
  };

  return (
    <div className={`rounded-lg border p-4 mb-6 ${getBannerStyles()}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{getTitle()}</h3>
            {quality && (
              <div className="flex items-center space-x-4 text-sm">
                <span className="font-medium">
                  Quality Score: {quality.score}%
                </span>
                {quality.passesThreshold ? (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Passes Threshold
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                    Below Threshold
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Success items */}
          {passed.length > 0 && status === 'success' && (
            <div className="mb-3">
              <div className="text-sm space-y-1">
                {passed.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span>{item.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error items */}
          {errors.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2">Issues to Fix:</h4>
              <div className="text-sm space-y-1">
                {errors.map((error, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{error.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning items */}
          {warnings.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
              <div className="text-sm space-y-1">
                {warnings.map((warning, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <InformationCircleIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>{warning.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality recommendations */}
          {quality && quality.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Quality Improvements:</h4>
              <div className="text-sm space-y-1">
                {quality.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <InformationCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className="text-green-600">
                ✓ {passed.length} passed
              </span>
              {warnings.length > 0 && (
                <span className="text-yellow-600">
                  ⚠ {warnings.length} warnings
                </span>
              )}
              {errors.length > 0 && (
                <span className="text-red-600">
                  ✗ {errors.length} errors
                </span>
              )}
            </div>
            {quality && (
              <span className="text-gray-600">
                {quality.issues} total issues found
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}