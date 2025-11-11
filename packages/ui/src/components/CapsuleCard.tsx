import React from 'react';
import type { Widget } from '@codecapsule/core';

interface CapsuleCardProps {
  widget: Widget;
  onEdit?: (widgetId: string) => void;
  onDelete?: (widgetId: string) => void;
  onView?: (widgetId: string) => void;
}

export function CapsuleCard({ widget, onEdit, onDelete, onView }: CapsuleCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {widget.capsule.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {widget.capsule.description}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {widget.capsule.language}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {widget.capsule.difficulty}
              </span>
              <span>{widget.analytics.views} views</span>
              <span>{widget.analytics.completions} completions</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {widget.verified && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Verified
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onView && (
              <button 
                onClick={() => onView(widget.id)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View
              </button>
            )}
            {onEdit && (
              <button 
                onClick={() => onEdit(widget.id)}
                className="text-gray-600 hover:text-gray-700 text-sm font-medium"
              >
                Edit
              </button>
            )}
          </div>
          
          {onDelete && (
            <button 
              onClick={() => onDelete(widget.id)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}