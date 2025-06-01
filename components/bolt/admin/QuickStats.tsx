import React from 'react';
import { StatsData } from '../../types/admin';
import { 
  BarChart2, 
  Users, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react';

interface QuickStatsProps {
  stats: StatsData;
}

const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  return (
    <div className="bg-white border-l border-gray-200 w-80 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
        <p className="text-sm text-gray-500">Dashboard overview</p>
      </div>

      {/* Stats Cards */}
      <div className="p-4 space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-700">Total Requests</h3>
            <BarChart2 className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-800">{stats.totalRequestsThisWeek}</p>
          <p className="text-xs text-blue-600">This week</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-orange-700">Active Requests</h3>
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-800">{stats.activeRequests}</p>
          <p className="text-xs text-orange-600">Needing attention</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-700">Successful Matches</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-800">{stats.successfulMatches}</p>
          <p className="text-xs text-green-600">Total to date</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-700">Response Time</h3>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-800">{stats.averageResponseTime}</p>
          <p className="text-xs text-purple-600">Average</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-800">3 new help requests today</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-800">5 requests solved this week</p>
              <p className="text-xs text-gray-500">Yesterday</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-yellow-100 p-2 rounded-full mr-3">
              <Calendar className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-800">Weekly review scheduled</p>
              <p className="text-xs text-gray-500">Tomorrow, 10:00 AM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full text-left text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Generate weekly report
          </button>
          <button className="w-full text-left text-sm px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors">
            Review pending matches
          </button>
          <button className="w-full text-left text-sm px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors">
            Check urgent requests
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">3 new</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-start p-2 bg-gray-50 rounded-md">
            <Bell className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-gray-800">Urgent: 2 requests over 7 days old</p>
              <p className="text-xs text-gray-500">5 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;