"use client"
import React, { useState, useEffect } from 'react';
// ... rest of your component code
import React, { useState, useEffect } from 'react';
import { FilterState, FilterType, AdminRequest, StatsData } from '../../types/admin';
import { mockRequests, mockStats } from '../../data/mockData';

// Components
import Header from './Header';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar';
import RequestsGrid from './RequestsGrid';
import QuickStats from './QuickStats';
import BulkActions from './BulkActions';

const AdminDashboard: React.FC = () => {
  // State
  const [requests, setRequests] = useState<AdminRequest[]>(mockRequests);
  const [stats, setStats] = useState<StatsData>(mockStats);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filter, setFilter] = useState<FilterState>({
    currentFilter: 'all',
    searchQuery: '',
    sortBy: 'newest',
  });

  // Counts for sidebar badges
  const counts = {
    all: requests.length,
    active: requests.filter(r => r.status === 'active').length,
    pending_match: requests.filter(r => r.status === 'pending_match').length,
    solved: requests.filter(r => r.status === 'solved').length,
  };

  // Filter requests based on current filter state
  const filteredRequests = requests.filter(request => {
    // Filter by status
    if (filter.currentFilter !== 'all' && request.status !== filter.currentFilter) {
      return false;
    }

    // Filter by search query
    if (filter.searchQuery) {
      const searchLower = filter.searchQuery.toLowerCase();
      return (
        request.userName.toLowerCase().includes(searchLower) ||
        request.challenge.toLowerCase().includes(searchLower) ||
        request.context.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Sort filtered requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    switch (filter.sortBy) {
      case 'oldest':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'urgent':
        return a.timeline === 'urgent' ? -1 : b.timeline === 'urgent' ? 1 : 0;
      case 'newest':
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  // Handlers
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(prev => ({ ...prev, currentFilter: newFilter }));
  };

  const handleSearchChange = (query: string) => {
    setFilter(prev => ({ ...prev, searchQuery: query }));
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    setFilter(prev => ({ ...prev, sortBy }));
  };

  const handleUpdateStatus = (id: string, status: AdminRequest['status']) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setRequests(prev => 
        prev.map(request => 
          request.id === id ? { ...request, status, lastUpdated: new Date() } : request
        )
      );
      setLoading(false);
    }, 500);
  };

  const handleViewProfile = (id: string) => {
    console.log(`View profile for request ${id}`);
    // In a real app, this would navigate to a profile view
  };

  const handleCreateMatch = (id: string) => {
    console.log(`Create match for request ${id}`);
    // In a real app, this would open a match creation modal
  };

  const handleBulkSolve = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setRequests(prev => 
        prev.map(request => 
          selectedIds.includes(request.id) 
            ? { ...request, status: 'solved', lastUpdated: new Date() } 
            : request
        )
      );
      setSelectedIds([]);
      setLoading(false);
    }, 800);
  };

  const handleBulkAssign = () => {
    console.log(`Assign mentor to ${selectedIds.length} requests`);
    // In a real app, this would open a mentor assignment modal
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Simulate initial data loading
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - conditionally shown on mobile */}
      <div className={`fixed inset-0 z-20 transition-opacity duration-300 ${
        sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } md:relative md:opacity-100 md:pointer-events-auto`}>
        <div className="absolute inset-0 bg-gray-600 bg-opacity-75 md:hidden" 
             onClick={handleToggleSidebar}></div>
        <div className={`relative transform transition-transform duration-300 h-full ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}>
          <Sidebar 
            currentFilter={filter.currentFilter}
            counts={counts}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          totalRequests={counts.all}
          onToggleSidebar={handleToggleSidebar}
        />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              {/* Search and filters */}
              <div className="mb-6">
                <SearchBar 
                  searchQuery={filter.searchQuery}
                  onSearchChange={handleSearchChange}
                />
              </div>

              {/* Content heading */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900">
                  {filter.currentFilter === 'all' 
                    ? 'All Help Requests' 
                    : filter.currentFilter === 'active' 
                      ? 'Active Requests'
                      : filter.currentFilter === 'pending_match'
                        ? 'Pending Match Requests'
                        : 'Solved Requests'}
                </h2>
                <p className="text-sm text-gray-500">
                  {sortedRequests.length} {sortedRequests.length === 1 ? 'request' : 'requests'} found
                </p>
              </div>

              {/* Requests grid */}
              <RequestsGrid 
                requests={sortedRequests}
                onUpdateStatus={handleUpdateStatus}
                onViewProfile={handleViewProfile}
                onCreateMatch={handleCreateMatch}
                loading={loading}
              />
            </div>
          </main>

          {/* Right panel - hidden on small screens */}
          <div className="hidden lg:block">
            <QuickStats stats={stats} />
          </div>
        </div>

        {/* Bulk actions bar */}
        <BulkActions 
          selectedCount={selectedIds.length}
          onClearSelection={handleClearSelection}
          onBulkSolve={handleBulkSolve}
          onBulkAssign={handleBulkAssign}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;