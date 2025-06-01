import React from 'react';
import { ChevronDown, Bell, User, Filter, List, SortAsc } from 'lucide-react';

interface HeaderProps {
  totalRequests: number;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ totalRequests, onToggleSidebar }) => {
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <button 
          onClick={onToggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 md:hidden"
        >
          <List className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 ml-2">Help Requests</h1>
        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {totalRequests} total
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Search bar - visible on larger screens */}
        <div className="hidden md:block relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 pl-10 p-2.5"
          >
            <option>All help types</option>
            <option>Career</option>
            <option>Technical</option>
            <option>Personal</option>
            <option>Other</option>
          </select>
        </div>

        {/* Sort dropdown */}
        <div className="hidden md:block relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SortAsc className="h-4 w-4 text-gray-400" />
          </div>
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-36 pl-10 p-2.5"
          >
            <option>Newest</option>
            <option>Oldest</option>
            <option>Urgent first</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button className="relative p-2 text-gray-600 rounded-full hover:bg-gray-100">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="border-l border-gray-300 h-6 mx-2"></div>
          
          <button className="flex items-center text-sm text-gray-700 hover:bg-gray-100 rounded-md p-2">
            <div className="w-7 h-7 bg-blue-500 rounded-full text-white flex items-center justify-center mr-2">
              <User className="w-4 h-4" />
            </div>
            <span className="hidden md:inline-block">Admin</span>
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;