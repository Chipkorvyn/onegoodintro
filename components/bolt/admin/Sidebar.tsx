import React from 'react';
import { FilterType } from '../../types/admin';
import { 
  LayoutDashboard, 
  Activity, 
  Clock, 
  CheckCircle, 
  Search,
  Users,
  Settings,
  BarChart,
  HelpCircle,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentFilter: FilterType;
  counts: {
    all: number;
    active: number;
    pending_match: number;
    solved: number;
  };
  onFilterChange: (filter: FilterType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentFilter, 
  counts, 
  onFilterChange 
}) => {
  const filterOptions = [
    { 
      id: 'all' as FilterType, 
      label: 'All Requests', 
      count: counts.all,
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    { 
      id: 'active' as FilterType, 
      label: 'Active', 
      count: counts.active,
      icon: <Activity className="w-5 h-5" />
    },
    { 
      id: 'pending_match' as FilterType, 
      label: 'Pending Match', 
      count: counts.pending_match,
      icon: <Clock className="w-5 h-5" />
    },
    { 
      id: 'solved' as FilterType, 
      label: 'Solved', 
      count: counts.solved,
      icon: <CheckCircle className="w-5 h-5" />
    },
  ];

  return (
    <div className="bg-white border-r border-gray-200 w-64 h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-blue-600">OneGoodIntro</h2>
        <p className="text-sm text-gray-600">Admin Dashboard</p>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search requests..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Filter Options */}
      <div className="p-4 flex-grow">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Help Requests
        </h3>
        <nav className="space-y-1">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                currentFilter === option.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <span className={`mr-3 ${currentFilter === option.id ? 'text-blue-500' : 'text-gray-500'}`}>
                  {option.icon}
                </span>
                {option.label}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                currentFilter === option.id
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {option.count}
              </span>
            </button>
          ))}
        </nav>

        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-3">
          Management
        </h3>
        <nav className="space-y-1">
          <button className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100">
            <Users className="w-5 h-5 mr-3 text-gray-500" />
            Mentors
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100">
            <BarChart className="w-5 h-5 mr-3 text-gray-500" />
            Analytics
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100">
            <Settings className="w-5 h-5 mr-3 text-gray-500" />
            Settings
          </button>
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100">
          <HelpCircle className="w-5 h-5 mr-3 text-gray-500" />
          Help & Support
        </button>
        <button className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100">
          <LogOut className="w-5 h-5 mr-3 text-gray-500" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;