import React from 'react';
import { AdminRequest } from '../../types/admin';
import { Clock, UserCircle, ExternalLink, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

interface RequestCardProps {
  request: AdminRequest;
  onUpdateStatus: (id: string, status: AdminRequest['status']) => void;
  onViewProfile: (id: string) => void;
  onCreateMatch: (id: string) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onUpdateStatus,
  onViewProfile,
  onCreateMatch,
}) => {
  // Determine timeline badge color
  const getTimelineBadgeColor = (timeline: AdminRequest['timeline']) => {
    switch (timeline) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'standard':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'flexible':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Determine status badge color
  const getStatusBadgeColor = (status: AdminRequest['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_match':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'solved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format status for display
  const formatStatus = (status: AdminRequest['status']) => {
    switch (status) {
      case 'pending_match':
        return 'Pending Match';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Format date to relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Format help type for display
  const formatHelpType = (type: AdminRequest['helpType']) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
      <div className="p-4">
        {/* Header with user info and timeline badge */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            {request.profileImage ? (
              <img 
                src={request.profileImage} 
                alt={request.userName} 
                className="w-10 h-10 rounded-full mr-3"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <UserCircle className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900">{request.userName}</h3>
              <p className="text-xs text-gray-500">
                <Clock className="inline-block w-3 h-3 mr-1" />
                {formatRelativeTime(request.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${getTimelineBadgeColor(request.timeline)}`}>
              {request.timeline.charAt(0).toUpperCase() + request.timeline.slice(1)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadgeColor(request.status)}`}>
              {formatStatus(request.status)}
            </span>
          </div>
        </div>
        
        {/* Challenge and context */}
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{request.title}</h2>
        <p className="text-sm text-gray-600 mb-3">{request.proof}</p>
        
        {/* Help type */}
        <div className="mb-4">
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
            {formatHelpType(request.helpType)}
          </span>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <button 
            onClick={() => onViewProfile(request.id)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View Profile
          </button>
          
          {request.status !== 'solved' ? (
            <button 
              onClick={() => onCreateMatch(request.id)}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Create Match
            </button>
          ) : (
            <button 
              onClick={() => onUpdateStatus(request.id, 'active')}
              className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md flex items-center transition-colors"
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestCard;