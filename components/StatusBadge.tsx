/**
 * StatusBadge component for displaying status with optional help count
 */

import React from 'react';

interface StatusBadgeProps {
  status: string;
  helpedCount: number;
}

const StatusBadge = ({ status, helpedCount }: StatusBadgeProps) => {
  const config = {
    verified: { bg: 'bg-teal-500', text: 'text-white', label: '✓ Verified' },
    'ai-generated': { bg: 'bg-gray-700', text: 'text-teal-400', label: '🎤 AI Generated' },
    default: { bg: 'bg-gray-700', text: 'text-gray-300', label: 'Added by you' }
  };
  
  const style = config[status as keyof typeof config] || config.default;
  
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
        {style.label}
      </span>
      {helpedCount > 0 && (
        <span className="text-xs text-gray-400 font-medium">
          Helped {helpedCount}
        </span>
      )}
    </div>
  );
};

export default StatusBadge;