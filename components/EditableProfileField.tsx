/**
 * EditableProfileField component for inline profile editing
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

type ActiveFieldType = 'challenge' | 'reason' | 'helpType' | 'name' | 'about' | 'linkedin' | 'role_title' | 'industry' | 'experience_years' | 'focus_area' | 'learning_focus' | 'project_description' | 'project_url' | null;

interface EditableProfileFieldProps {
  fieldName: ActiveFieldType;
  value: string;
  placeholder: string;
  icon: LucideIcon;
  isEditing: boolean;
  fieldValues: Record<string, string>;
  onFieldClick: (fieldName: ActiveFieldType) => void;
  onFieldChange: (fieldName: ActiveFieldType, value: string) => void;
  onFieldSave: (fieldName: ActiveFieldType) => void;
  inputType?: 'text' | 'number';
  isTextArea?: boolean;
  maxLength?: number;
}

const EditableProfileField = ({
  fieldName,
  value,
  placeholder,
  icon: Icon,
  isEditing,
  fieldValues,
  onFieldClick,
  onFieldChange,
  onFieldSave,
  inputType = 'text',
  isTextArea = false,
  maxLength
}: EditableProfileFieldProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isTextArea && fieldName) {
      onFieldSave(fieldName);
    }
  };

  if (!fieldName) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-gray-700 rounded flex items-center justify-center">
        <Icon className="h-2 w-2 text-gray-300" />
      </div>
      {isEditing ? (
        isTextArea ? (
          <textarea
            value={fieldValues[fieldName] || ''}
            onChange={(e) => fieldName && onFieldChange(fieldName, e.target.value)}
            onBlur={() => fieldName && onFieldSave(fieldName)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-white text-sm bg-gray-600 border border-gray-500 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500 min-h-[60px] resize-none"
            placeholder={placeholder}
            maxLength={maxLength}
          />
        ) : (
          <input
            type={inputType}
            value={fieldValues[fieldName] || ''}
            onChange={(e) => fieldName && onFieldChange(fieldName, e.target.value)}
            onBlur={() => fieldName && onFieldSave(fieldName)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-white text-sm bg-gray-600 border border-gray-500 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500"
            placeholder={placeholder}
            maxLength={maxLength}
          />
        )
      ) : (
        <span 
          onClick={() => fieldName && onFieldClick(fieldName)}
          className="text-white text-sm cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors flex-1"
        >
          {value || placeholder}
        </span>
      )}
    </div>
  );
};

export default EditableProfileField;