import React from 'react';
import { AdminRequest } from '../../types/admin';
import RequestCard from './RequestCard';

interface RequestsGridProps {
  requests: AdminRequest[];
  onUpdateStatus: (id: string, status: AdminRequest['status']) => void;
  onViewProfile: (id: string) => void;
  onCreateMatch: (id: string) => void;
  loading: boolean;
}

const RequestsGrid: React.FC<RequestsGridProps> = ({
  requests,
  onUpdateStatus,
  onViewProfile,
  onCreateMatch,
  loading
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <RequestCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-gray-100 rounded-full p-4 mb-4">
          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 16v-4m-4 0h8" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No requests found</h3>
        <p className="text-gray-500 max-w-md">
          There are no help requests matching your current filters. Try changing your search criteria or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          onUpdateStatus={onUpdateStatus}
          onViewProfile={onViewProfile}
          onCreateMatch={onCreateMatch}
        />
      ))}
    </div>
  );
};

// Skeleton loader for request cards
const RequestCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
      </div>
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
      <div className="h-6 bg-gray-200 rounded-full w-20 mb-4"></div>
      <div className="pt-3 border-t border-gray-100 flex justify-between">
        <div className="h-8 bg-gray-200 rounded w-24"></div>
        <div className="h-8 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
};

export default RequestsGrid;