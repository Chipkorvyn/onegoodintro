import React from 'react';
import { 
  CheckCircle, 
  UserPlus, 
  RefreshCw, 
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkSolve: () => void;
  onBulkAssign: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onBulkSolve,
  onBulkAssign
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 flex items-center justify-between z-10 animate-slideUp">
      <div className="flex items-center">
        <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? 'request' : 'requests'} selected
        </span>
        <button 
          onClick={onClearSelection}
          className="ml-3 text-sm text-gray-600 hover:text-gray-900"
        >
          Clear selection
        </button>
      </div>
      
      <div className="flex space-x-2">
        <button 
          onClick={onBulkSolve}
          className="flex items-center text-sm px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <CheckCircle className="w-4 h-4 mr-1.5" />
          Mark Solved
        </button>
        
        <button 
          onClick={onBulkAssign}
          className="flex items-center text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Assign Mentor
        </button>
        
        <button 
          className="flex items-center text-sm px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Change Status
        </button>
        
        <button 
          className="p-1.5 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BulkActions;